
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import { UserProgress } from './types';

const INITIAL_PROGRESS: UserProgress = {
    points: 0,
    streak: 0,
    lastActiveDate: '',
    badges: [],
    totalFocusMinutes: 0,
    sessionsCompleted: 0
};

const App: React.FC = () => {
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [userProgress, setUserProgress] = useState<UserProgress>(() => {
        try {
            const saved = window.localStorage.getItem('focusFlowUserProgress');
            return saved ? JSON.parse(saved) : INITIAL_PROGRESS;
        } catch (e) {
            console.error("Failed to load user progress", e);
            return INITIAL_PROGRESS;
        }
    });

    // Sync progress to local storage
    useEffect(() => {
        try {
            window.localStorage.setItem('focusFlowUserProgress', JSON.stringify(userProgress));
        } catch (e) {
            console.error("Failed to save user progress", e);
        }
    }, [userProgress]);

    const handleToggleSound = () => {
        setIsSoundEnabled(prev => !prev);
    };

    return (
        <div className="min-h-screen bg-brand-dark font-sans antialiased">
            <Header isSoundEnabled={isSoundEnabled} onToggleSound={handleToggleSound} userProgress={userProgress} />
            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Dashboard isSoundEnabled={isSoundEnabled} userProgress={userProgress} onUpdateProgress={setUserProgress} />
                </div>
            </main>
        </div>
    );
};

export default App;
