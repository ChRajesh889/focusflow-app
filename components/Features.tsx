import React from 'react';
import SparklesIcon from './icons/SparklesIcon';
import SlidersIcon from './icons/SlidersIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import LinkIcon from './icons/LinkIcon';

const features = [
    {
        Icon: SparklesIcon,
        title: "AI-Powered Suggestions",
        description: "Receive intelligent, productive alternatives when you get distracted, helping you build better habits and refocus your attention."
    },
    {
        Icon: SlidersIcon,
        title: "Customizable Blocking",
        description: "Set daily time limits for specific apps or start a temporary 'Focus Session' to block a group of apps and achieve deep work."
    },
    {
        Icon: ChartBarIcon,
        title: "Actionable Insights",
        description: "Visualize your focus and distraction patterns over time with easy-to-read charts, helping you understand your digital wellbeing."
    },
    {
        Icon: LinkIcon,
        title: "Seamless Integration",
        description: "When an app is blocked, a clean notification appears in a new tab. This avoids jarring pop-ups while effectively keeping you on track."
    }
];

const Features: React.FC = () => {
    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg mt-8">
            <h2 className="text-2xl font-bold text-center mb-6">Why FocusFlow AI</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                    <div key={index} className="bg-gray-700/50 p-6 rounded-lg flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="bg-brand-accent/20 p-3 rounded-full mb-4">
                            <feature.Icon className="h-8 w-8 text-brand-accent" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Features;