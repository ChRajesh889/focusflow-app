
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AppInfo } from '../types';

interface DistractionBreakdownProps {
    appUsage: { [key: string]: number };
    apps: AppInfo[];
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];

const DistractionBreakdown: React.FC<DistractionBreakdownProps> = ({ appUsage, apps }) => {
    const data = Object.entries(appUsage)
        .map(([appId, seconds]) => {
            const app = apps.find(a => a.id === appId);
            return {
                name: app?.name || appId,
                value: Math.round(Number(seconds) / 60) // minutes
            };
        })
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);

    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-700/30 rounded-lg">
                <p className="text-sm">No distraction data for today yet.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-64">
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #4B5563',
                            borderRadius: '0.5rem',
                            color: '#F9FAFB'
                        }}
                        formatter={(value: number) => [`${value} min`, 'Duration']}
                    />
                    <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right" 
                        wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DistractionBreakdown;
