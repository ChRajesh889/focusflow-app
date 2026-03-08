import React from 'react';
import { AppInfo } from '../types';
import SparklesIcon from './icons/SparklesIcon';

interface AppLauncherProps {
    apps: AppInfo[];
    onAppClick: (appId: string) => void;
}

const AppLauncher: React.FC<AppLauncherProps> = ({ apps, onAppClick }) => {
    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Simulated App Launcher</h2>
            <p className="text-sm text-gray-400 mb-6">
                Click an app to start a tracked session. The app will open in a new tab, and this screen will switch to a timer. If you've reached your daily limit, you'll be blocked.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {apps.map(app => (
                    <button
                        key={app.id}
                        onClick={() => onAppClick(app.id)}
                        className="group p-4 bg-gray-700/50 border-2 border-gray-600 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ease-in-out hover:border-brand-accent hover:bg-indigo-900/50"
                        aria-label={`Launch ${app.name}`}
                    >
                        <app.Icon className="h-10 w-10 text-gray-300" />
                        <span className="text-sm font-medium text-center mt-2">{app.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AppLauncher;