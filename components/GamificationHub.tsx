
import React from 'react';
import { UserProgress, Badge } from '../types';
import { BADGES } from '../constants';
import TrophyIcon from './icons/TrophyIcon';
import StarIcon from './icons/StarIcon';
import FireIcon from './icons/FireIcon';
import CheckIcon from './icons/CheckIcon';

interface GamificationHubProps {
    progress: UserProgress;
}

const GamificationHub: React.FC<GamificationHubProps> = ({ progress }) => {
    
    const getIcon = (iconName: string, className: string) => {
        switch (iconName) {
            case 'trophy': return <TrophyIcon className={className} />;
            case 'star': return <StarIcon className={className} />;
            case 'fire': return <FireIcon className={className} />;
            case 'check': return <CheckIcon className={className} />;
            default: return <StarIcon className={className} />;
        }
    };

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <TrophyIcon className="w-6 h-6 mr-2 text-yellow-500" />
                Achievements
            </h2>
            
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700/50 p-3 rounded-lg flex flex-col items-center">
                    <span className="text-gray-400 text-xs uppercase font-semibold">Current Streak</span>
                    <div className="flex items-center mt-1">
                        <FireIcon className="w-5 h-5 text-orange-500 mr-1" />
                        <span className="text-xl font-bold text-white">{progress.streak} days</span>
                    </div>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg flex flex-col items-center">
                    <span className="text-gray-400 text-xs uppercase font-semibold">Total Points</span>
                    <div className="flex items-center mt-1">
                        <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
                        <span className="text-xl font-bold text-white">{progress.points}</span>
                    </div>
                </div>
            </div>

            {/* Badges Grid */}
            <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Badges</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {BADGES.map(badge => {
                        const isUnlocked = progress.badges.includes(badge.id);
                        return (
                            <div 
                                key={badge.id} 
                                className={`group relative p-3 rounded-lg border-2 flex flex-col items-center justify-center text-center transition-all ${
                                    isUnlocked 
                                    ? 'bg-gray-800 border-brand-accent shadow-md shadow-brand-accent/20' 
                                    : 'bg-gray-800/30 border-gray-700 opacity-50 grayscale'
                                }`}
                                title={isUnlocked ? `${badge.name}: ${badge.description}` : 'Locked Badge'}
                            >
                                <div className={`p-2 rounded-full mb-2 ${isUnlocked ? 'bg-brand-accent/20' : 'bg-gray-700'}`}>
                                    {getIcon(badge.icon, `w-6 h-6 ${isUnlocked ? 'text-brand-accent' : 'text-gray-500'}`)}
                                </div>
                                <span className="text-xs font-medium truncate w-full">{badge.name}</span>
                                
                                {/* Tooltip for desktop */}
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-32 bg-gray-900 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-700 shadow-xl">
                                    <p className="font-bold mb-1">{badge.name}</p>
                                    <p className="text-gray-300">{badge.description}</p>
                                    {!isUnlocked && <p className="text-red-400 mt-1 font-semibold">Locked</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GamificationHub;
