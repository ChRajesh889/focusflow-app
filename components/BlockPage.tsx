import React, { useState } from 'react';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import { BlockPageSettings } from '../types';

interface BlockPageProps {
    appName: string;
    appId: string;
    onReturn: () => void;
    reason?: 'limit' | 'focus';
    settings?: BlockPageSettings;
    backendUrl?: string;
    userId?: string;
}

const BlockPage: React.FC<BlockPageProps> = ({ appName, appId, onReturn, reason = 'limit', settings, backendUrl, userId }) => {
    const accentColor = settings?.themeColor || '#4F46E5';
    const message = settings?.customMessage
        ? settings.customMessage.replace(/\$\{appName\}/g, appName)
        : (reason === 'focus'
            ? `${appName} is blocked during your focus session.`
            : `You've reached your daily time limit for ${appName}.`);

    const [isExtending, setIsExtending] = useState(false);
    const [extensionError, setExtensionError] = useState('');

    const handleSnooze = async () => {
        setIsExtending(true);
        setExtensionError('');
        try {
            const url = `${backendUrl || 'http://localhost:3001'}/api/limits/extend`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appId, additionalMinutes: 5, userId })
            });

            if (response.ok) {
                onReturn(); // Go back to usage or dashboard so the app unblocks
            } else {
                setExtensionError('Failed to extend limit.');
            }
        } catch (err) {
            setExtensionError('Could not connect to server.');
        } finally {
            setIsExtending(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-150px)] flex items-center justify-center p-4 animate-fade-in relative overflow-hidden rounded-xl">
            {settings?.customImageUrl && (
                <div
                    className="absolute inset-0 opacity-10 blur-sm pointer-events-none"
                    style={{
                        backgroundImage: `url(\${settings.customImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
            )}

            <div className="bg-brand-secondary/90 backdrop-blur-md p-8 rounded-lg shadow-2xl w-full max-w-2xl text-center border border-white/5 relative z-10">
                <ShieldCheckIcon className="h-20 w-20 mx-auto mb-6" style={{ color: accentColor }} />

                <h1 className="text-4xl font-bold text-white mb-3">
                    {reason === 'focus' ? 'Focus Mode Active' : "Time's Up!"}
                </h1>
                <p className="text-lg text-gray-300 mb-8 whitespace-pre-wrap">
                    {message}
                </p>

                <p className="text-gray-400 mb-6">
                    {reason === 'focus'
                        ? "Stay focused on your goal! You can access this app after your session ends."
                        : "Come back tomorrow for more. In the meantime, focus on your other goals!"}
                </p>

                {extensionError && (
                    <div className="text-red-400 mb-4 text-sm font-medium p-2 bg-red-400/10 rounded border border-red-400/20">{extensionError}</div>
                )}

                <div className="flex flex-col gap-4 max-w-xs mx-auto">
                    {reason === 'limit' && (
                        <button
                            onClick={handleSnooze}
                            disabled={isExtending}
                            className="w-full py-4 px-8 text-lg font-bold rounded-lg transition duration-300 shadow-lg border-2 bg-transparent hover:bg-white/5 disabled:opacity-50"
                            style={{ borderColor: accentColor, color: accentColor }}
                        >
                            {isExtending ? 'Extending...' : 'Snooze - Add 5 Mins'}
                        </button>
                    )}

                    <button
                        onClick={onReturn}
                        className="w-full py-4 px-8 text-lg font-bold text-white rounded-lg transition duration-300 shadow-lg disabled:opacity-50"
                        style={{ backgroundColor: accentColor }}
                        disabled={isExtending}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlockPage;
