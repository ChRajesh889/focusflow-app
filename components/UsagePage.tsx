
import React, { useState, useEffect, useRef } from 'react';
import { AppInfo } from '../types';
import BlockPage from './BlockPage';
import { launchApp } from '../utils/appLauncher';

interface UsagePageProps {
    app: AppInfo;
    timeLimitSeconds: number;
    timeUsedSeconds: number;
    onLeave: (timeSpent: number) => void;
    onReportUsage?: (timeSpent: number) => void;
    onCloseTab?: () => void;
    onLaunchApp?: () => void;
    isBlockedByFocus?: boolean;
    backendUrl?: string;
    userId?: string;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.abs(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const UsagePage: React.FC<UsagePageProps> = ({
    app,
    timeLimitSeconds,
    timeUsedSeconds,
    onLeave,
    onReportUsage,
    onCloseTab,
    onLaunchApp,
    isBlockedByFocus = false,
    backendUrl,
    userId
}) => {
    const timeSpentInSessionRef = useRef(0);
    const timerRef = useRef<number | null>(null);
    const hasLimit = timeLimitSeconds > 0;
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [blockReason, setBlockReason] = useState<'limit' | 'focus'>('limit');

    const [displayTime, setDisplayTime] = useState(
        hasLimit ? Math.max(0, timeLimitSeconds - timeUsedSeconds) : 0
    );

    // Handle immediate blocking if opened while blocked by focus session
    useEffect(() => {
        if (isBlockedByFocus) {
            setBlockReason('focus');
            setIsTimeUp(true);
        }
    }, [isBlockedByFocus]);

    useEffect(() => {
        const startTime = Date.now();
        const initialUsage = timeSpentInSessionRef.current;
        const initialDisplayTime = displayTime;

        if (isTimeUp) return;

        const checkTime = () => {
            const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
            timeSpentInSessionRef.current = initialUsage + elapsedSecs;

            if (hasLimit) {
                const newDisplayTime = Math.max(0, initialDisplayTime - elapsedSecs);
                setDisplayTime(newDisplayTime);

                if (newDisplayTime <= 0) {
                    if (timerRef.current) clearInterval(timerRef.current);

                    if (onReportUsage) {
                        onReportUsage(timeSpentInSessionRef.current);
                    }

                    if (onCloseTab) {
                        onCloseTab();
                    }

                    setBlockReason('limit');
                    setIsTimeUp(true);
                }
            } else {
                setDisplayTime(initialDisplayTime + elapsedSecs);
            }
        };

        timerRef.current = window.setInterval(checkTime, 500); // Check every 500ms for extra precision

        // Force check when tab becomes visible again, in case background timer was throttled
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkTime();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [hasLimit, timeLimitSeconds, timeUsedSeconds, isTimeUp, onReportUsage, onCloseTab]);

    const handleLeave = () => {
        if (!isTimeUp && onReportUsage) {
            onReportUsage(timeSpentInSessionRef.current);
        }
        onLeave(timeSpentInSessionRef.current); // Keep the argument for compatibility if needed, but Dashboard now ignores it
    };

    if (isTimeUp || isBlockedByFocus) {
        return <BlockPage appName={app.name} appId={app.id} onReturn={handleLeave} reason={isBlockedByFocus ? 'focus' : blockReason} backendUrl={backendUrl} userId={userId} />;
    }

    return (
        <div className="min-h-[calc(100vh-150px)] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-brand-secondary p-8 rounded-lg shadow-2xl w-full max-w-2xl text-center">
                <app.Icon className="h-20 w-20 mx-auto text-gray-300 mb-6" />

                <h1 className="text-3xl font-bold text-white mb-3">
                    Tracking Session for <span className="text-brand-accent">{app.name}</span>
                </h1>
                <p className="text-lg text-gray-300 mb-8">
                    Your usage is being timed. The app will be closed automatically after the time completes.
                </p>

                <div className="my-8">
                    <p className="text-sm text-gray-400 uppercase tracking-wider">
                        {hasLimit ? 'Time Remaining' : 'Time Spent'}
                    </p>
                    <p className={`text-6xl font-mono font-bold tracking-tighter mt-2 ${(displayTime <= 60 && hasLimit && displayTime > 0) ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {formatTime(displayTime)}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                    <button
                        onClick={() => onLaunchApp ? onLaunchApp() : launchApp(app)}
                        className="w-full max-w-xs py-4 px-8 text-lg font-bold text-white bg-brand-accent hover:bg-brand-accent-hover rounded-lg transition duration-300 shadow-lg flex items-center justify-center"
                    >
                        Go to {app.name}
                    </button>
                    <button
                        onClick={handleLeave}
                        className="w-full max-w-xs py-4 px-8 text-lg font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition duration-300 shadow-lg"
                    >
                        End Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UsagePage;
