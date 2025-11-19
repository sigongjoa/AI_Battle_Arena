# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Battle Arena** is a reinforcement learning (RL) training platform that combines a React/TypeScript frontend with a Python backend to enable training, evaluating, and visualizing AI agents in a 2D fighting game environment. It uses Stable-Baselines3 (PPO/A2C algorithms) for training agents that play a fighting game via WebRTC communication.

## Repository Structure

```
AI_Battle_Arena/
├── arcade-clash/                # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── webrtc/              # WebRTC implementation (client.ts, signaling.ts, data_channels.ts)
│   │   ├── shared_game_logic/   # Deterministic game engine (engine.ts, fixed_point.ts, game_state.ts)
│   │   └── poc_tests/           # Proof of concept tests for determinism
│   ├── components/              # React components (RLDashboardPage, RLDemoPage, GameScreen, etc.)
│   └── public/                  # Static assets and mock data (mock_dashboard_data.json, mock_game_data.json)
├── backend/                      # FastAPI signaling server & WebSocket handlers
│   ├── main.py                  # FastAPI app with WebSocket signaling (/ws/{peer_id})
│   ├── signaling/               # Signaling server implementation
│   ├── ws_handlers/             # WebSocket handlers for game & training endpoints
│   ├── api/                     # HTTP API routes
│   ├── core/                    # Game & training orchestration modules
│   ├── data/                    # Game data (character moves, stats)
│   └── requirements.txt         # Python dependencies
├── src/                          # Python RL environment & core logic
│   ├── simulation/              # SimulationManager (seeding, FPS control, reproducibility)
│   ├── metric_extractor/        # Episode data collection & analysis
│   ├── qa_evaluator/            # Game feel analysis & QA reporting
│   ├── report_generator/        # HTML/PDF report generation
│   ├── log_collector/           # Log collection utility
│   ├── utils/                   # Configuration loading, event types
│   ├── fighting_env.py          # Gymnasium environment definition
│   ├── game.py                  # Core Pygame-based game engine
│   ├── player.py                # Character mechanics (health, attacks, movement)
│   ├── collision_manager.py     # Hit detection system
│   ├── reward_calculator.py     # Multi-component reward function
│   ├── rl_policy_manager.py     # PolicyManager for PPO/A2C switching
│   ├── mock_game_client.py      # Headless game simulation (no frontend needed)
│   ├── webrtc_client.py         # WebRTC client for frontend communication
│   └── wrappers.py              # Environment wrappers (e.g., FlattenActionSpaceWrapper)
├── tests/                        # Python pytest suite
├── docs/                         # Project documentation
├── models/                       # Trained RL models (saved by train_rl_agent.py)
├── logs/                         # Training logs & TensorBoard data
├── data/                         # Game data and databases
├── reports/                      # Generated QA reports (HTML/MD)
├── config.yaml                  # RL training hyperparameters (policy config, training settings)
├── train_rl_agent.py            # Main training script
├── evaluate_agent.py            # Agent evaluation (with --headless flag for no-frontend mode)
├── run_e2e_test.py              # End-to-end integration testing
├── run_e2e_automation.py        # Automated E2E test runner
├── run_battle.py                # Run battles with trained RL agents
├── run_match.py                 # Run 2-player matches with trained RL agents
└── .github/workflows/           # CI/CD workflows (phase2-ci-cd.yml)
```

## Architecture Overview

### Frontend (arcade-clash/)

**Stack**: React 19 + TypeScript 5.8, Vite, WebRTC, Chart.js, Vitest

**Key Components**:
- `App.tsx` - Main router and screen orchestration
- `components/RLAgentController.tsx` - Bridges Python RL environment with browser game
- `components/RLDemoPage.tsx` - RL demo visualization (with static mock data)
- `components/RLDashboardPage.tsx` - RL metrics dashboard with Chart.js
- `components/GameScreen.tsx` - Game rendering interface
- `src/webrtc/client.ts` - WebRTC peer connection management
- `src/webrtc/signaling.ts` - WebSocket signaling handler
- `src/webrtc/data_channels.ts` - Data channel management
- `src/shared_game_logic/engine.ts` - TypeScript game engine (deterministic)
- `src/shared_game_logic/fixed_point.ts` - Fixed-point math for determinism
- `src/shared_game_logic/game_state.ts` - Game state definitions

**Networking**: WebRTC DataChannel for game state/actions, WebSocket signaling via backend for connection setup.

### Backend (backend/)

**Stack**: FastAPI + Uvicorn, WebSockets, Python

**Purpose**: WebSocket signaling server for WebRTC setup, game state relay, and training orchestration
- `main.py` - FastAPI app with WebSocket signaling handler (`/ws/{peer_id}`)
- `signaling/server.py` - Signaling server implementation for message relay
- `ws_handlers/handlers.py` - WebSocket handlers for game state and training endpoints
- `api/routes.py` - HTTP API routes for agent management and model querying
- `core/` - Game and training orchestration modules
- `data/game_data.py` - Character moves, stats, and game constants

### Python RL Core (src/)

**Stack**: Gymnasium, Stable-Baselines3, Pygame, NumPy

**Key Modules**:
- `fighting_env.py` - Gymnasium environment (action: Tuple(Discrete(6), Discrete(6)), obs: Box 8-dim)
- `game.py` - Core game engine (Pygame-based, shared logic with TypeScript)
- `player.py` - Character mechanics (health, attacks, movement)
- `collision_manager.py` - Hit detection system
- `reward_calculator.py` - Multi-component reward function
- `rl_policy_manager.py` - PolicyManager for PPO/A2C algorithm switching (factory pattern)
- `webrtc_client.py` - WebRTC client for frontend communication
- `mock_game_client.py` - Headless game simulation (no frontend needed, used with `--headless` flag)
- `wrappers.py` - Environment wrappers (e.g., FlattenActionSpaceWrapper)
- `simulation/SimulationManager` - Reproducibility, seeding, and FPS control
- `metric_extractor/` - Episode data collection and performance metrics
- `qa_evaluator/` - Game feel analysis and persona-based QA
- `report_generator/` - HTML/PDF report generation with game analysis
- `log_collector/` - Game event and training log collection

## Common Development Commands

### Frontend (arcade-clash/)

```bash
cd arcade-clash
npm install                 # Install dependencies
npm run dev                 # Start dev server (Vite) - runs on http://localhost:5173
npm run build               # Build for production
npm run preview             # Preview production build locally
npm test                    # Run all tests (Vitest) in watch mode
npm run test:ui             # Run tests in interactive UI mode with browser interface
npm run test:coverage       # Generate coverage report
npm run test:poc            # Run proof of concept tests (determinism, rollback)
```

### Backend (Python WebSocket Signaling Server)

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run FastAPI signaling server (WebRTC signaling & game state relay)
cd /path/to/AI_Battle_Arena
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Or run directly
python backend/main.py
```

### Python RL Training & Evaluation

```bash
# Train RL agent(s) - generates trained models in models/ directory
PYTHONPATH=. python train_rl_agent.py

# Evaluate trained agent (with frontend visualization)
PYTHONPATH=. python evaluate_agent.py

# Evaluate in headless mode (no frontend, faster - uses MockGameClient)
PYTHONPATH=. python evaluate_agent.py --headless

# Run battles with trained agent
PYTHONPATH=. python run_battle.py

# Run 2-player matches with trained agents
PYTHONPATH=. python run_match.py

# Run end-to-end integration tests
PYTHONPATH=. python run_e2e_test.py

# Automated E2E test runner
PYTHONPATH=. python run_e2e_automation.py

# Run Python tests
pytest tests/                                                 # All tests
pytest tests/test_fighting_env.py                            # Single test file
pytest tests/test_fighting_env.py::test_step_returns_valid_output  # Single test
pytest -v tests/                                             # Verbose output
pytest -s tests/                                             # Verbose with stdout
```

### Python Linting

```bash
# Python linting (code quality check)
flake8 src/ tests/ --max-line-length=120
```

## Key Configuration Files

**config.yaml** - RL training hyperparameters (learning rate, batch size, reward scaling, etc.)

**arcade-clash/tsconfig.json** - TypeScript compiler options

**arcade-clash/vite.config.ts** - Frontend build configuration

**arcade-clash/vitest.config.ts** - Frontend test framework setup

## Critical Implementation Details

### Environment Action/Observation Spaces

```python
# Actions (per agent): [0=Idle, 1=Forward, 2=Backward, 3=Jump, 4=Attack1, 5=Attack2]
action_space = Tuple(Discrete(6), Discrete(6))  # Both P1 and P2

# Observations (normalized 0-1): [p1_x, p1_y, p1_hp, p1_state, p2_x, p2_y, p2_hp, p2_state]
observation_space = Box(0.0, 1.0, shape=(8,), dtype=float32)
```

### Communication Flow

1. **Training Mode**: `train_rl_agent.py` → `FightingEnv` → Frontend (via WebRTC) → Game engine → RL algorithm
   - Requires: Frontend running (`npm run dev`), Backend signaling server running
   - Uses: WebRTC DataChannel for realtime game state/action exchange

2. **Evaluation Mode**: `evaluate_agent.py` → `FightingEnv` with trained model → Browser visualization
   - Uses: Same WebRTC communication as training mode
   - Loads: Pre-trained model from `models/` directory

3. **Headless Mode** (Phase 2): `evaluate_agent.py --headless` → `MockGameClient` (no frontend, faster)
   - Uses: `src/mock_game_client.py` for game simulation
   - Benefits: 10-100x faster evaluation, no frontend dependencies, CI/CD friendly
   - Output: Metrics and game replays saved to `logs/` and `reports/`

### WebRTC Connection Setup

- Frontend (`arcade-clash/src/webrtc/client.ts`) initiates peer connection, requests SDP offer
- Backend (`backend/main.py` at `/ws/{peer_id}`) relays WebRTC signaling messages via WebSocket
- `backend/signaling/server.py` and `ws_handlers/handlers.py` manage message routing
- Data channel (`src/webrtc/data_channels.ts`) used for bidirectional game state/action exchange
- Peer ID required for routing signaling messages to correct frontend instance
- Connection established in `FightingEnv.setup_webrtc()` during environment initialization

### Reproducibility and Determinism

`SimulationManager` (in `src/simulation/simulation_manager.py`) handles:
- Seeding for deterministic behavior (consistent agent performance across runs)
- Frame timing and FPS control (60 FPS standard)
- Synchronization between agents and environment
- Key for testing: Use same seed to replay exact game sequences

TypeScript game engine (`arcade-clash/src/shared_game_logic/engine.ts`) must stay in sync with Python game engine (`src/game.py`):
- Uses fixed-point math (`fixed_point.ts`) to avoid floating-point precision issues
- Movement, collision, and damage calculations must be identical
- Tests exist in `arcade-clash/src/poc_tests/` to verify engine parity

## Testing Strategy

### Python Tests (pytest)

- Located in `tests/` directory
- Use fixtures for mock WebRTC clients and game state
- Test environment step mechanics, collision detection, reward calculation
- Integration tests verify full training loop with mock frontend

### Frontend Tests (Vitest)

- Located in `arcade-clash/` with `.test.tsx` files
- Test React components, WebRTC client logic, game engine
- Run with `npm test` or `npm run test:ui` for interactive debugging

## CI/CD Pipeline

GitHub Actions (`.github/workflows/phase2-ci-cd.yml`):

1. **Backend CI**: Linting (flake8) + Testing (pytest)
2. **Model Evaluation**: Load trained models, run evaluation episodes, archive results
3. **Frontend**: Build and test React application
4. **Deployment**: Deploy frontend to GitHub Pages, archive trained models/logs

**Key Environment Variables**:
- `PYTHONPATH=.` (required for imports when running from root)
- `CUDA_VISIBLE_DEVICES` (for GPU acceleration in CI)
- `GEMINI_API_KEY` (if using character generation features)

## Important Files to Understand First

Start with these files to understand the architecture:

1. **src/fighting_env.py** - Core Gymnasium environment; defines action/observation spaces and training loop
2. **src/game.py** - Game engine (Pygame); core game mechanics, movement, and physics
3. **src/reward_calculator.py** - Reward function; understand how agent performance is measured
4. **arcade-clash/src/webrtc/client.ts** - WebRTC peer connection management; critical for frontend-backend communication
5. **arcade-clash/src/shared_game_logic/engine.ts** - TypeScript game engine mirror; must stay deterministic with Python version
6. **backend/main.py** - FastAPI signaling server; understand WebRTC signaling flow
7. **train_rl_agent.py** - Main training script; shows how environment, models, and callbacks work together
8. **config.yaml** - Training hyperparameters; learning rate, batch size, reward scaling, policy configuration

For understanding Phase 2 (headless mode):
- **src/mock_game_client.py** - Game simulation without frontend (used for CI/CD and fast evaluation)
- **evaluate_agent.py** - Agent evaluation with `--headless` flag support
- **src/metric_extractor/** - Episode metrics collection for analysis

## Recent Phase 2 Focus

- Headless evaluation mode for faster testing without browser
- RL policy visualization with static dashboard data
- CI/CD automation for training and model evaluation
- GitHub Pages deployment for frontend
- Multi-agent environment improvements

## Debugging Tips

### WebRTC and Networking

- **WebRTC connection fails**: Check backend is running on port 8000, verify WebSocket logs with `--reload` flag
- **Signaling timeout**: Ensure `backend/main.py` is receiving WebSocket messages (check peer ID routing in `ws_handlers/handlers.py`)
- **Data channel not opening**: Verify frontend is sending initial handshake message through `src/webrtc/data_channels.ts`
- **Stale peer connections**: Restart backend server to clear peer ID registry

### Game Logic and Physics

- **Game state mismatches**: Ensure TypeScript `arcade-clash/src/shared_game_logic/engine.ts` matches Python `src/game.py` exactly
  - Check: Movement calculations, collision detection, damage application, state transitions
  - Use: `npm run test:poc` to run determinism tests
- **Physics differ between runs**: Check `SimulationManager` seeding in `src/simulation/simulation_manager.py`
- **Replay inconsistency**: Verify fixed-point math implementation (`arcade-clash/src/shared_game_logic/fixed_point.ts`)

### Training and RL

- **Training divergence/instability**:
  - Review reward function in `src/reward_calculator.py` (check for scaling issues)
  - Adjust hyperparameters in `config.yaml` (learning_rate, n_steps, batch_size)
  - Check environment observation normalization (must be 0-1 range)
- **Model not learning**: Verify environment step() returns correct (obs, reward, terminated, truncated, info) tuple
- **Out of memory during training**: Reduce `n_envs` or `n_steps` in `config.yaml`

### Testing and Evaluation

- **Flaky tests**: Use `SimulationManager` seeding to ensure reproducibility (same seed = same gameplay)
- **Headless mode slower than expected**: Check if using GPU (`CUDA_VISIBLE_DEVICES`) and verify batch processing
- **Evaluation metrics missing**: Check logs in `logs/` directory, verify `metric_extractor/` is configured correctly

### Frontend Issues

- **Frontend not receiving game state**: Check `arcade-clash/components/RLAgentController.tsx` message parsing
- **Vite dev server not updating**: Clear node_modules cache: `rm -rf node_modules/.vite && npm run dev`
- **Tests fail in CI but pass locally**: Check `PYTHONPATH=.` is set, verify `CUDA_VISIBLE_DEVICES` if GPU-dependent

## Dependencies and Environment Setup

### Python Requirements (backend/requirements.txt)

```
fastapi                  # Web framework for signaling server
uvicorn[standard]        # ASGI server
gymnasium                # RL environment toolkit
stable-baselines3        # PPO/A2C algorithms
pygame                   # Game rendering
python-socketio          # WebSocket communication
websockets               # WebSocket protocol
aiortc                   # WebRTC implementation
pydantic                 # Data validation
scipy, numpy             # Numerical computing
pyyaml                   # Configuration parsing
pytest-mock              # Testing utilities
```

### Frontend Dependencies (arcade-clash/package.json)

```
react@19                 # UI framework
react-dom@19             # DOM rendering
typescript~5.8           # Type safety
vite@6                   # Build tool
vitest@3                 # Test framework
peerjs@1.5               # WebRTC wrapper
chart.js@4               # Data visualization
eventemitter3            # Event handling
msgpack-lite             # Binary message encoding
@bufbuild/*              # Protocol buffers (gRPC-web)
```

### Environment Variables

```bash
PYTHONPATH=.             # Required for imports from project root
CUDA_VISIBLE_DEVICES     # GPU selection (e.g., "0,1" for multi-GPU)
GEMINI_API_KEY           # For character generation features (optional)
```

## Stack Summary

**Frontend**: React 19 + TypeScript 5.8, Vite 6, WebRTC, Chart.js, Vitest 3, Protocol Buffers
**Backend**: FastAPI, Uvicorn, Python 3.11, WebSockets, aiortc
**RL/ML**: Gymnasium, Stable-Baselines3 (PPO/A2C), Pygame, NumPy, SciPy
**Networking**: WebRTC DataChannel, WebSocket signaling, MessagePack serialization
**Testing**: pytest + pytest-mock (Python), Vitest with jsdom (Frontend)
**Deployment**: GitHub Actions CI/CD, GitHub Pages (frontend), Model archiving
