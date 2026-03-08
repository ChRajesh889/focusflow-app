import React from 'react';
import { FocusSession, AppInfo } from '../types';
import CheckIcon from './icons/CheckIcon';
import StopIcon from './icons/StopIcon';
import GoalIcon from './icons/GoalIcon';

interface FocusHistoryProps {
    sessions: FocusSession[];
    apps: AppInfo[];
}

const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

const FocusHistory: React.FC<FocusHistoryProps> = ({ sessions, apps }) => {
    const appInfoMap = React.useMemo(() => new Map(apps.map(app => [app.id, app])), [apps]);

    if (!sessions || sessions.length === 0) {
        return (
            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Focus Session History</h2>
                <div className="text-center py-8">
                    <GoalIcon className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">Your past focus sessions will appear here once you complete them.</p>
                </div>
            </div>
        );
    }
    
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Focus Session History</h2>
            <ul className="space-y-4 max-h-[28rem] overflow-y-auto pr-2 custom-scrollbar">
                {sortedSessions.map(session => {
                    const blockedAppsInfo = session.appsBlocked.map(id => appInfoMap.get(id)).filter((app): app is AppInfo => !!app);
                    const completedMinutes = Math.floor(session.completedDuration / 60);
                    const plannedMinutes = Math.floor(session.duration / 60);

                    return (
                        <li key={session.id} className="bg-gray-700/50 p-4 rounded-lg animate-fade-in">
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold text-white truncate flex items-center">
                                        <GoalIcon className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{session.goal}</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{formatDate(session.date)}</p>
                                </div>
                                <div className={`flex-shrink-0 flex items-center text-xs font-semibold px-2 py-1 rounded-full ${session.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {session.status === 'completed' 
                                        ? <CheckIcon className="w-3 h-3 mr-1" /> 
                                        : <StopIcon className="w-3 h-3 mr-1" />}
                                    <span className="capitalize">{session.status}</span>
                                </div>
                            </div>
                            <div className="mt-3 border-t border-gray-600 pt-3 space-y-2">
                                <p className="text-sm text-gray-300">
                                    Completed <span className="font-bold text-white">{completedMinutes} min</span> of planned <span className="font-bold text-white">{plannedMinutes} min</span>.
                                </p>
                                {blockedAppsInfo.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1.5">Blocked Apps:</p>
                                        <div className="flex items-center space-x-2">
                                            {blockedAppsInfo.map(app => (
                                                // Fix: Wrap icon in a span with a title attribute for tooltip, as the Icon component type does not directly accept 'title'.
                                                <span key={app.id} title={app.name}>
                                                    <app.Icon className="w-5 h-5 text-gray-300" />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {session.interventions && session.interventions.length > 0 && (
                                    <div className="pt-1">
                                        <p className="text-xs text-gray-400">Interventions:</p>
                                        <p className="text-sm text-gray-300 italic">
                                            {session.interventions.length} intervention(s) occurred.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default FocusHistory;
