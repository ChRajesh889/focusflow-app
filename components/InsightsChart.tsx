
import React from 'react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, CartesianGrid } from 'recharts';
import { ChartDataPoint } from '../types';

interface InsightsChartProps {
    data: ChartDataPoint[];
    xAxisDataKey: string;
}

const InsightsChart: React.FC<InsightsChartProps> = ({ data, xAxisDataKey }) => {
    return (
        <div className="w-full h-64">
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey={xAxisDataKey} stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => String(value)} />
                    <YAxis stroke="#9CA3AF" fontSize={12} unit="m" />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #4B5563',
                            borderRadius: '0.5rem'
                        }}
                        labelStyle={{ color: '#F9FAFB' }}
                    />
                    <Legend wrapperStyle={{fontSize: '14px'}} />
                    <Bar dataKey="focus" fill="#4F46E5" name="Focus (min)" />
                    <Bar dataKey="distraction" fill="#EF4444" name="Distraction (min)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default InsightsChart;