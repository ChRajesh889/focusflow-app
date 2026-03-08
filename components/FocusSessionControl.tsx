import React, { useState } from 'react';
import GoalIcon from './icons/GoalIcon';
import BellIcon from './icons/BellIcon';
import { SoundName } from '../utils/audioUtils';
import PauseIcon from './icons/PauseIcon';

interface FocusSessionControlProps {
    isFocusing: boolean;
    onStart: () => void;
    onStop: () => void;
    timeLeft: number;
    hasSelectedApps: boolean;
    goal: string;
    onGoalChange: (goal: string) => void;
    duration: number; // in seconds
    onDurationChange: (duration: number) => void; // in seconds
    syncToCalendar: boolean;
    onSyncToCalendarChange: (value: boolean) => void;
    startSound: SoundName;
    onStartSoundChange: (sound: SoundName) => void;
    endSound: SoundName;
    onEndSoundChange: (sound: SoundName) => void;
    isIdle: boolean;
    idleTimeout: number; // in seconds
    onIdleTimeoutChange: (timeout: number) => void;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const FocusSessionControl: React.FC<FocusSessionControlProps> = ({
    isFocusing, onStart, onStop, timeLeft, hasSelectedApps,
    goal, onGoalChange, duration, onDurationChange,
    syncToCalendar, onSyncToCalendarChange,
    startSound, onStartSoundChange, endSound, onEndSoundChange,
    isIdle, idleTimeout, onIdleTimeoutChange
}) => {
    const isPresetDuration = [25 * 60, 50 * 60, 90 * 60].includes(duration);
    const [isCustomMode, setIsCustomMode] = useState(!isPresetDuration && duration > 0);

    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const progress = duration > 0 ? (timeLeft / duration) : 0;
    const offset = circumference - progress * circumference;

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = Number(e.target.value);
        if (value === -1) {
            setIsCustomMode(true);
            onDurationChange(0); // Await user input for custom duration
        } else {
            setIsCustomMode(false);
            onDurationChange(value);
        }
    };

    const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const minutes = parseInt(e.target.value, 10);
        onDurationChange(!isNaN(minutes) && minutes > 0 ? minutes * 60 : 0);
    };

    const isButtonDisabled = !hasSelectedApps || !goal || duration <= 0;

    let warningMessage = '';
    if (!isFocusing) {
        if (!hasSelectedApps) {
            warningMessage = 'Select at least one app to block.';
        } else if (!goal) {
            warningMessage = 'Please set a goal for your session.';
        } else if (duration <= 0) {
            warningMessage = 'Please set a valid session duration.';
        }
    }

    return (
        <div className="mt-8 flex flex-col items-center border-t-2 border-gray-700 pt-8">
            {!isFocusing && (
                <>
                    <h2 className="text-xl font-semibold mb-4">2. Plan Your Focus Session</h2>
                    <div className="w-full max-w-lg space-y-4 mb-6">
                        <div className="relative">
                            <GoalIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="What's your goal for this session?"
                                value={goal}
                                onChange={(e) => onGoalChange(e.target.value)}
                                className="w-full bg-gray-800 border-2 border-gray-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="duration-select" className="block text-sm font-medium text-gray-400 mb-2">Session Duration:</label>
                            <select
                                id="duration-select"
                                value={isCustomMode ? -1 : duration}
                                onChange={handleSelectChange}
                                className="w-full bg-gray-800 border-2 border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors"
                            >
                                <option value={25 * 60}>25 Minutes (Pomodoro)</option>
                                <option value={50 * 60}>50 Minutes (Deep Work)</option>
                                <option value={90 * 60}>90 Minutes (Ultradian Cycle)</option>
                                <option value={-1}>Custom...</option>
                            </select>
                        </div>
                        {isCustomMode && (
                            <div className="animate-fade-in flex flex-col">
                                <label htmlFor="custom-duration-input" className="block text-sm font-medium text-gray-400 mb-2">Custom Duration (minutes):</label>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => {
                                            const currentMins = duration > 0 ? duration / 60 : 0;
                                            const newMins = Math.max(1, currentMins - 5);
                                            onDurationChange(newMins * 60);
                                        }}
                                        className="w-12 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded-md border-2 border-gray-600 transition-colors font-bold text-xl"
                                        aria-label="Decrease time by 5 minutes"
                                    >
                                        -
                                    </button>
                                    <input
                                        id="custom-duration-input"
                                        type="number"
                                        min="1"
                                        placeholder="e.g., 15"
                                        value={duration > 0 ? duration / 60 : ''}
                                        onChange={handleCustomInputChange}
                                        className="flex-grow text-center bg-gray-800 border-2 border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors"
                                    />
                                    <button
                                        onClick={() => {
                                            const currentMins = duration > 0 ? duration / 60 : 0;
                                            const newMins = currentMins + 5;
                                            onDurationChange(newMins * 60);
                                        }}
                                        className="w-12 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded-md border-2 border-gray-600 transition-colors font-bold text-xl"
                                        aria-label="Increase time by 5 minutes"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                            <label htmlFor="sync-calendar" className="text-sm font-medium text-gray-300">Sync to Calendar</label>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="sync-calendar"
                                    className="sr-only peer"
                                    checked={syncToCalendar}
                                    onChange={(e) => onSyncToCalendarChange(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-accent/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                            <label htmlFor="idle-timeout-select" className="flex items-center text-sm font-medium text-gray-300">
                                <PauseIcon className="w-5 h-5 mr-2 text-gray-400" />
                                Pause on Inactivity
                            </label>
                            <select
                                id="idle-timeout-select"
                                value={idleTimeout}
                                onChange={(e) => onIdleTimeoutChange(Number(e.target.value))}
                                className="bg-gray-700 border-2 border-gray-600 rounded-md py-1 px-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors"
                            >
                                <option value={0}>Disabled</option>
                                <option value={60}>After 1 minute</option>
                                <option value={300}>After 5 minutes</option>
                                <option value={600}>After 10 minutes</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                            <label htmlFor="start-sound-select" className="flex items-center text-sm font-medium text-gray-300">
                                <BellIcon className="w-5 h-5 mr-2 text-gray-400" />
                                Start Sound
                            </label>
                            <select
                                id="start-sound-select"
                                value={startSound}
                                onChange={(e) => onStartSoundChange(e.target.value as SoundName)}
                                className="bg-gray-700 border-2 border-gray-600 rounded-md py-1 px-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors"
                            >
                                <option value="Bell">Bell</option>
                                <option value="Chime">Chime</option>
                                <option value="Digital">Digital</option>
                                <option value="None">None</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                            <label htmlFor="end-sound-select" className="flex items-center text-sm font-medium text-gray-300">
                                <BellIcon className="w-5 h-5 mr-2 text-gray-400" />
                                End Sound
                            </label>
                            <select
                                id="end-sound-select"
                                value={endSound}
                                onChange={(e) => onEndSoundChange(e.target.value as SoundName)}
                                className="bg-gray-700 border-2 border-gray-600 rounded-md py-1 px-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors"
                            >
                                <option value="Bell">Bell</option>
                                <option value="Chime">Chime</option>
                                <option value="Digital">Digital</option>
                                <option value="None">None</option>
                            </select>
                        </div>
                    </div>
                </>
            )}

            <div className="w-full max-w-sm flex flex-col items-center space-y-4">
                {!isFocusing && <h2 className="text-xl font-semibold">3. Start Your Session</h2>}
                {isFocusing && (
                    <div className="text-center w-full">
                        <div className="mb-4 bg-gray-800/50 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Focusing On</p>
                            <p className="font-semibold truncate">{goal || 'Your Task'}</p>
                        </div>
                        <div className="relative w-64 h-64 mx-auto my-4">
                            <svg className="w-full h-full" viewBox="0 0 200 200">
                                <circle
                                    className="text-gray-700"
                                    strokeWidth="12"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r={radius}
                                    cx="100"
                                    cy="100"
                                />
                                <circle
                                    className="text-brand-accent"
                                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                                    strokeWidth="12"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r={radius}
                                    cx="100"
                                    cy="100"
                                    transform="rotate(-90 100 100)"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                {isIdle && (
                                    <p className="text-yellow-400 text-lg font-semibold animate-pulse mb-2">PAUSED</p>
                                )}
                                <p className="text-gray-400 text-sm">Time Remaining</p>
                                <p className="text-5xl font-mono font-bold tracking-tighter">{formatTime(timeLeft)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!isFocusing ? (
                    <button
                        onClick={onStart}
                        disabled={isButtonDisabled}
                        className="w-full py-4 px-8 text-lg font-bold text-white bg-brand-accent hover:bg-brand-accent-hover rounded-lg transition duration-300 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        Start Focus Session
                    </button>
                ) : (
                    <button
                        onClick={onStop}
                        className="w-full py-3 px-8 text-lg font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition duration-300 shadow-lg"
                    >
                        Stop Session
                    </button>
                )}
                <div className="h-4">
                    {warningMessage && <p className="text-xs text-center text-yellow-400 animate-fade-in">{warningMessage}</p>}
                </div>
            </div>
        </div>
    );
};

export default FocusSessionControl;
