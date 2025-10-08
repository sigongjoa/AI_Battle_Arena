import pytest
import os
import time
import sqlite3
import json
import gzip
from pathlib import Path

from src.simulation.human_error_layer import HumanErrorLayer
from src.simulation.network_simulator import NetworkSimulator
from src.log_collector.log_collector import LogCollector
from src.metric_extractor.db_manager import DBManager
from src.metric_extractor.metric_extractor import MetricExtractor
from src.qa_evaluator.ai_personas import PERSONAS
from src.qa_evaluator.mock_rl_trainer import MockRLTrainer
from src.qa_evaluator.mock_multi_persona_analyzer import MockMultiPersonaAnalyzer
from src.qa_evaluator.mock_rlhf_interface import MockRLHFInterface
from src.report_generator.report_generator import ReportGenerator
from src.utils.config_loader import load_config

# Fixture for a clean database for tests
@pytest.fixture(scope="module")
def clean_db_manager():
    db_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'db', 'test_metrics.db'))
    if os.path.exists(db_file):
        os.remove(db_file)
    manager = DBManager(db_file=db_file)
    yield manager
    if os.path.exists(db_file):
        os.remove(db_file)

# Test HumanErrorLayer
def test_human_error_layer_delay():
    layer = HumanErrorLayer()
    layer.reaction_time_mean = 2
    layer.reaction_time_std = 0
    layer.mistake_probability = 0
    layer.drop_probability = 0
    
    action = "test_action"
    # Frame 1: Send action, it gets queued and delayed
    assert layer.apply_human_error(action) is None
    # Frame 2: No new action, delay continues
    assert layer.apply_human_error(None) is None
    # Frame 3: No new action, delay finishes, action delivered
    assert layer.apply_human_error(None) == action
    # Ensure no more actions are pending
    assert layer.apply_human_error(None) is None

def test_human_error_layer_mistake():
    layer = HumanErrorLayer()
    layer.reaction_time_mean = 0 # No delay
    layer.reaction_time_std = 0
    layer.mistake_probability = 1.0 # Always make a mistake
    layer.drop_probability = 0
    
    action = "test_action"
    # Action should be processed immediately with a mistake
    assert layer.apply_human_error(action) == "test_action_mistake"
    assert layer.apply_human_error(None) is None # No more actions pending

def test_human_error_layer_drop():
    layer = HumanErrorLayer()
    layer.reaction_time_mean = 0
    layer.reaction_time_std = 0
    layer.mistake_probability = 0
    layer.drop_probability = 1.0 # Always drop
    
    action = "test_action"
    assert layer.apply_human_error(action) is None
    assert layer.apply_human_error(None) is None # No more actions pending

# Test NetworkSimulator
def test_network_simulator_latency():
    simulator = NetworkSimulator()
    simulator.latency_mean = 100 # 100ms latency
    simulator.latency_std = 0
    simulator.packet_loss_probability = 0
    
    action = "net_action"
    start_time = time.time()
    assert simulator.simulate_network_conditions(action) is None # First call, packet queued
    
    # Simulate time passing
    time.sleep(0.05) # 50ms
    assert simulator.simulate_network_conditions(None) is None # Still in transit
    
    time.sleep(0.06) # Total 110ms
    assert simulator.simulate_network_conditions(None) == action # Delivered

def test_network_simulator_packet_loss():
    simulator = NetworkSimulator()
    simulator.latency_mean = 0
    simulator.latency_std = 0
    simulator.packet_loss_probability = 1.0 # Always lose
    
    action = "net_action"
    assert simulator.simulate_network_conditions(action) is None

# Test LogCollector (basic functionality)
def test_log_collector_session_management(tmp_path):
    log_dir = tmp_path / "test_logs"
    collector = LogCollector(log_dir=str(log_dir), compress_after_session=False) # No compression for easier inspection
    session_id = collector.start_session()
    collector.log_event("TEST_EVENT", {"data": "value"})
    collector.end_session()
    
    log_files = list(log_dir.glob(f"session_*_{session_id}.jsonl"))
    assert len(log_files) == 1
    with open(log_files[0], 'r') as f:
        content = f.read()
        assert "TEST_EVENT" in content
        assert session_id in content

# Test DBManager
def test_db_manager_insertions(clean_db_manager):
    db_manager = clean_db_manager
    test_session_id = "db_test_session"
    db_manager.insert_session(test_session_id, time.time(), time.time() + 10, "log.jsonl.gz", "replay.bin")
    db_manager.insert_qa_metric(test_session_id, "StabilityScore", 0.99, 1, time.time())
    db_manager.insert_immersion_metric(test_session_id, "TensionIndex", 0.75, 1, 5, time.time())
    
    conn = sqlite3.connect(db_manager.db_file)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM sessions WHERE session_id = ?", (test_session_id,))
    assert cursor.fetchone()[0] == 1
    cursor.execute("SELECT COUNT(*) FROM qa_metrics WHERE session_id = ?", (test_session_id,))
    assert cursor.fetchone()[0] == 1
    cursor.execute("SELECT COUNT(*) FROM immersion_metrics WHERE session_id = ?", (test_session_id,))
    assert cursor.fetchone()[0] == 1
    conn.close()

# Test MetricExtractor (conceptual)
def test_metric_extractor_conceptual(clean_db_manager, tmp_path):
    db_manager = clean_db_manager
    
    # Create a mock log file
    mock_session_id = "mock_extract_session"
    mock_log_filepath = tmp_path / f"session_20250101_000000_{mock_session_id}.jsonl.gz"
    with gzip.open(mock_log_filepath, 'wt', encoding='utf-8') as f:
        f.write(json.dumps({"event_type": "SESSION_START", "timestamp": time.time(), "session_id": mock_session_id}) + '\n')
        f.write(json.dumps({"event_type": "GAME_STATE", "timestamp": time.time(), "session_id": mock_session_id, "data": {"hp": 100}}) + '\n')
        f.write(json.dumps({"event_type": "ACTION", "timestamp": time.time(), "session_id": mock_session_id, "data": {"action": "punch"}}) + '\n')
        f.write(json.dumps({"event_type": "HUMAN_ERROR_INJECTED", "timestamp": time.time(), "session_id": mock_session_id, "data": {"error_type": "mistake"}}) + '\n')
        f.write(json.dumps({"event_type": "SESSION_END", "timestamp": time.time(), "session_id": mock_session_id}) + '\n')

    extractor = MetricExtractor(db_manager)
    extractor.extract_metrics_from_log(str(mock_log_filepath))

    conn = sqlite3.connect(db_manager.db_file)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM sessions WHERE session_id = ?", (mock_session_id,))
    assert cursor.fetchone()[0] == 1
    cursor.execute("SELECT COUNT(*) FROM qa_metrics WHERE session_id = ? AND metric_name = 'StabilityScore'", (mock_session_id,))
    assert cursor.fetchone()[0] == 1
    cursor.execute("SELECT COUNT(*) FROM immersion_metrics WHERE session_id = ? AND metric_name = 'FunScore'", (mock_session_id,)) # Assert FunScore
    assert cursor.fetchone()[0] == 1
    conn.close()

# Test AI Personas (basic definition check)
def test_ai_personas_defined():
    assert "Pro-gamer AI" in PERSONAS
    assert PERSONAS["Pro-gamer AI"].reward_weights is not None

# Test MockRLTrainer (conceptual)
def test_mock_rl_trainer_conceptual():
    trainer = MockRLTrainer()
    model_path = trainer.train_persona("Beginner AI", total_timesteps=100)
    assert "models/beginner_ai_model.zip" in model_path

# Test MockMultiPersonaAnalyzer (conceptual)
def test_mock_multi_persona_analyzer_conceptual(clean_db_manager):
    analyzer = MockMultiPersonaAnalyzer(clean_db_manager)
    results = analyzer.analyze_personas(["Beginner AI", "Pro-gamer AI"], num_simulations_per_pair=1)
    assert "Beginner AI_vs_Pro-gamer AI" in results

# Test MockRLHFInterface (conceptual)
def test_mock_rlhf_interface_conceptual(clean_db_manager):
    rlhf_interface = MockRLHFInterface(clean_db_manager)
    comparisons = rlhf_interface.collect_pairwise_comparisons(num_comparisons=2)
    assert len(comparisons) == 2
    reward_model_info = rlhf_interface.train_reward_model(comparisons)
    assert "accuracy" in reward_model_info

# Test ReportGenerator (conceptual)
def test_report_generator_conceptual(clean_db_manager, tmp_path):
    db_manager = clean_db_manager
    
    # Ensure there's a session with metrics for the report
    test_session_id = "report_test_session"
    db_manager.insert_session(test_session_id, time.time(), time.time() + 10, "log_path.jsonl.gz", "replay_path.bin")
    db_manager.insert_qa_metric(test_session_id, "StabilityScore", 0.98, 1, time.time())
    db_manager.insert_qa_metric(test_session_id, "BalanceScore", 0.85, 1, time.time())
    db_manager.insert_immersion_metric(test_session_id, "ComboRhythmScore", 0.92, 1, 5, time.time())
    db_manager.insert_immersion_metric(test_session_id, "TensionIndex", 0.6, 1, 5, time.time())
    db_manager.insert_immersion_metric(test_session_id, "FunScore", 0.75, 1, 5, time.time()) # Insert FunScore

    generator = ReportGenerator(db_manager, template_dir=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'report_generator', 'templates')))
    output_dir = tmp_path / "test_reports"
    
    # Mock persona analysis results to pass to the report generator
    mock_persona_analysis_results = {
        "Beginner AI_vs_Pro-gamer AI": {
            "avg_stability": 0.9, "avg_balance": 0.8, "avg_responsiveness": 0.85, "avg_combo_rhythm": 0.7, "avg_fun_score": 0.8,
            "conclusion": "Beginner AI showed slightly better stability against Pro-gamer AI."
        }
    }

    report_path = generator.generate_report(test_session_id, persona_analysis_results=mock_persona_analysis_results, output_dir=str(output_dir))
    
    assert os.path.exists(report_path)
    with open(report_path, 'r') as f:
        content = f.read()
        assert test_session_id in content
        assert "StabilityScore" in content
        assert "FunScore" in content # Check for FunScore content
        assert "Beginner AI_vs_Pro-gamer AI" in content # Check for persona analysis content
