
import React from 'react';
import { AppInfo } from '../types';
import PlusIcon from './icons/PlusIcon';
import FireIcon from './icons/FireIcon';

interface AppSelectorProps {
    apps: AppInfo[];
    recentlyUsedApps: AppInfo[];
    limits: { [key: string]: number }; // limits in minutes
    onSetLimit: (appId: string, limit: number) => void;
    usage: { [key: string]: number }; // usage in seconds
    focusApps: string[];
    onToggleFocusApp: (appId: string) => void;
    isFocusing: boolean;
    onUpdateAppCategory: (appId: string, newCategory: string) => void;
    onOpenAddAppModal: () => void;
    onAppClick: (appId: string) => void;
    onRemoveApp: (appId: string) => void;
}

const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const AppSelector: React.FC<AppSelectorProps> = ({
    apps, recentlyUsedApps, limits, onSetLimit, usage, focusApps, onToggleFocusApp, isFocusing, onUpdateAppCategory, onOpenAddAppModal, onAppClick, onRemoveApp
}) => {

    const groupedApps = apps.reduce((acc, app) => {
        const category = app.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(app);
        return acc;
    }, {} as Record<string, AppInfo[]>);

    const allCategories = Object.keys(groupedApps).sort();

    const handleCategoryChange = (appId: string, newCategoryValue: string) => {
        if (newCategoryValue === '__CREATE_NEW__') {
            const newCategoryName = window.prompt("Enter the new category name:");
            if (newCategoryName && newCategoryName.trim()) {
                onUpdateAppCategory(appId, newCategoryName.trim());
            }
        } else {
            onUpdateAppCategory(appId, newCategoryValue);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold mb-2">1. Select Apps to Block & Set Daily Limits</h2>
                    <p className="text-gray-400">Use checkboxes for focus sessions. Set daily usage limits to control habits.</p>
                </div>
                <button
                    onClick={onOpenAddAppModal}
                    className="flex-shrink-0 flex items-center justify-center bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md shadow-brand-accent/20"
                    aria-label="Add custom app"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add App
                </button>
            </div>

            {/* Recently Used Apps Section */}
            {recentlyUsedApps && recentlyUsedApps.length > 0 && (
                <div className="bg-gray-800/40 border-2 border-gray-700 p-4 rounded-xl animate-fade-in">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
                        <FireIcon className="w-4 h-4 mr-2 text-orange-500" />
                        Recently Used Apps
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {recentlyUsedApps.map(app => (
                            <div
                                key={app.id}
                                className="flex flex-col items-center group relative cursor-pointer"
                                onClick={() => onToggleFocusApp(app.id)}
                                title={`Toggle block for ${app.name}`}
                            >
                                <div className={`p-3 rounded-xl transition-all border-2 ${focusApps.includes(app.id) ? 'bg-brand-accent/20 border-brand-accent scale-105' : 'bg-gray-700 border-gray-600 grayscale hover:grayscale-0'}`}>
                                    <app.Icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 truncate max-w-[60px] text-center">{app.name}</span>
                                {focusApps.includes(app.id) && (
                                    <div className="absolute top-0 right-0 w-3 h-3 bg-brand-accent rounded-full border-2 border-brand-secondary"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-8">
                {(Object.entries(groupedApps) as [string, AppInfo[]][]).map(([category, appsInCategory]) => (
                    <div key={category} className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700 pb-2">
                            {category}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {appsInCategory.map(app => {
                                const isLimitReached = limits[app.id] > 0 && (usage[app.id] || 0) >= limits[app.id] * 60;
                                return (
                                    <div
                                        key={app.id}
                                        className={`flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border-2 transition-all ${focusApps.includes(app.id) ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-700'
                                            } ${isLimitReached ? 'opacity-90' : ''}`}
                                    >
                                        <div className="flex items-center space-x-4 overflow-hidden flex-grow">
                                            <input
                                                type="checkbox"
                                                checked={focusApps.includes(app.id)}
                                                onChange={() => onToggleFocusApp(app.id)}
                                                disabled={isFocusing}
                                                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-brand-accent focus:ring-brand-accent cursor-pointer disabled:cursor-not-allowed z-10"
                                            />
                                            <div
                                                className="flex items-center space-x-4 cursor-pointer flex-grow min-w-0 group"
                                                onClick={() => onAppClick(app.id)}
                                            >
                                                <div className="flex-shrink-0 relative">
                                                    <app.Icon className={`h-8 w-8 transition-transform group-hover:scale-110 ${isLimitReached ? 'text-red-400' : 'text-gray-300'}`} />
                                                    {isLimitReached && (
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800"></div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <p className="font-semibold text-white truncate group-hover:text-brand-accent transition-colors">{app.name}</p>
                                                        {isLimitReached && (
                                                            <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Limit Reached</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-400 space-x-2">
                                                        <span className={isLimitReached ? 'text-red-400 font-medium' : ''}>{formatTime(usage[app.id] || 0)} today</span>
                                                        <span>•</span>
                                                        <select
                                                            value={app.category}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                handleCategoryChange(app.id, e.target.value);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="bg-transparent border-none p-0 text-brand-accent hover:underline cursor-pointer focus:ring-0 text-[10px]"
                                                        >
                                                            {allCategories.map(cat => (
                                                                <option key={cat} value={cat} className="bg-gray-800 text-white">{cat}</option>
                                                            ))}
                                                            <option value="__CREATE_NEW__" className="bg-gray-800 text-brand-accent font-bold">New Category...</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3 ml-4">
                                            <div className="text-right">
                                                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Limit (min)</label>
                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const currentLimit = limits[app.id] || 0;
                                                            onSetLimit(app.id, Math.max(0, currentLimit - 1));
                                                        }}
                                                        className="w-5 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors"
                                                        aria-label="Decrease limit by 1 minute"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="None"
                                                        value={limits[app.id] || ''}
                                                        onChange={(e) => onSetLimit(app.id, parseInt(e.target.value) || 0)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`w-12 bg-gray-700 border rounded px-1 py-1 text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all ${isLimitReached ? 'border-red-500/50' : 'border-gray-600'}`}
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const currentLimit = limits[app.id] || 0;
                                                            onSetLimit(app.id, currentLimit + 1);
                                                        }}
                                                        className="w-5 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors"
                                                        aria-label="Increase limit by 1 minute"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRemoveApp(app.id); }}
                                                className="mt-4 text-gray-500 hover:text-red-500 p-1 rounded-full transition-colors flex-shrink-0"
                                                title="Remove App"
                                                aria-label={`Remove ${app.name}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppSelector;
