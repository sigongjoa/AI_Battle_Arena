import React, { useState, useEffect } from 'react';
import { Character, Screen } from '../types';
import { Play } from './Icons';
const initialMetrics: any = {
    loss: { value: 0, prev: 0 },
    reward: { value: 0, prev: 0 },
    q_value: { value: 0, prev: 0 },
    episode_length: { value: 0, prev: 0 },
};

interface MetricCardProps {
    label: string;
    value: string;
    change: string;
    changeColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, changeColor }) => (
    <div className="flex flex-col gap-0.5 rounded-lg bg-primary-bg/50 p-2">
        <p className="text-xs font-medium text-text-gray">{label}</p>
        <p className="text-xl font-bold text-text-light">{value}</p>
        <p className={`text-xs font-medium ${changeColor}`}>{change}</p>
    </div>
);

interface MetricsPanelProps {
    title: string;
    metrics: MetricCardProps[];
    color: string;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ title, metrics, color }) => (
    <div className="bg-surface-bg/80 rounded-xl border border-border-color p-3 w-[280px] backdrop-blur-sm">
        <h3 className={`text-lg font-bold ${color} px-1 pb-2`}>{title}</h3>
        <div className="grid grid-cols-2 gap-2">
            {metrics.map(metric => <MetricCard key={metric.label} {...metric} />)}
        </div>
    </div>
);

const formatMetrics = (metrics: TrainingMetricsState): MetricCardProps[] => {
    const calcChange = (current: number, prev: number) => {
        if (prev === 0) return { text: '+0.0%', color: 'text-green-500' };
        const change = ((current - prev) / prev) * 100;
        const color = change >= 0 ? 'text-green-500' : 'text-red-500';
        return { text: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, color };
    };

    const lossChange = calcChange(metrics.loss.value, metrics.loss.prev);
    lossChange.color = parseFloat(lossChange.text) >= 0 ? 'text-red-500' : 'text-green-500';

    return [
        { label: 'Loss', value: metrics.loss.value.toFixed(3), change: lossChange.text, changeColor: lossChange.color },
        { label: 'Reward', value: metrics.reward.value.toFixed(1), ...calcChange(metrics.reward.value, metrics.reward.prev) },
        { label: 'Q-Value', value: metrics.q_value.value.toFixed(2), ...calcChange(metrics.q_value.value, metrics.q_value.prev) },
        { label: 'Ep. Length', value: metrics.episode_length.value.toString(), ...calcChange(metrics.episode_length.value, metrics.episode_length.prev) },
    ];
};

const TrainingMode: React.FC<TrainingModeProps> = ({ player1, player2, onNavigate }) => {
    const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetricsState>(initialMetrics);



    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden p-4 md:p-6 lg:p-8 bg-primary-bg">
            <div className="flex h-full grow flex-col">
                <div className="flex-1">
                    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-cover bg-center" style={{ backgroundImage: 'url("/assets/backgrounds/background2.png")' }}>
                         <div className="absolute inset-0 bg-black/30"></div>
                        <div className="absolute top-4 left-4 z-10">
                             <MetricsPanel title="P1 (RYU) Training" metrics={formatMetrics(trainingMetrics)} color="text-team-a" />
                        </div>
                        <div className="absolute top-4 right-4 z-10">
                             <MetricsPanel title="P2 (KEN) Training" metrics={formatMetrics(trainingMetrics)} color="text-team-b" />
                        </div>
                        <button className="z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-black/50 text-white transition-transform hover:scale-110">
                            <Play />
                        </button>
                    </div>
                </div>
            </div>
             <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 text-center w-full left-1/2 -translate-x-1/2">
                <button
                    onClick={() => onNavigate(Screen.MainMenu)}
                    className="bg-highlight-yellow text-primary-bg font-bold py-3 px-8 rounded-lg transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-highlight-yellow/50"
                >
                    RETURN
                </button>
            </div>
        </div>
    );
};

export default TrainingMode;
