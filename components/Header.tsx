import React from 'react';
import FocusIcon from './icons/FocusIcon';
import SmartphoneIcon from './icons/SmartphoneIcon';
import SoundOnIcon from './icons/SoundOnIcon';
import SoundOffIcon from './icons/SoundOffIcon';
import FireIcon from './icons/FireIcon';
import StarIcon from './icons/StarIcon';
import { UserProgress } from '../types';

interface HeaderProps {
    isSoundEnabled: boolean;
    onToggleSound: () => void;
    userProgress?: UserProgress; // Optional for now to maintain compatibility if needed immediately
}

const Header: React.FC<HeaderProps> = ({ isSoundEnabled, onToggleSound, userProgress }) => {
    return (
        <header className="bg-brand-secondary shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <img src="/logo.png" alt="FocusFlow AI Logo" className="h-8 w-8 rounded mr-3 shadow-md border border-gray-700" />
                        <span className="text-2xl font-bold text-white hidden sm:block">FocusFlow AI</span>
                        <span className="text-2xl font-bold text-white sm:hidden">FocusFlow AI</span>
                    </div>

                    <div className="flex items-center space-x-4">
                        {userProgress && (
                            <div className="flex items-center space-x-4 mr-2 bg-gray-800 py-1 px-3 rounded-full border border-gray-700">
                                <div className="flex items-center" title="Current Streak">
                                    <FireIcon className="h-5 w-5 text-orange-500 mr-1" />
                                    <span className="font-bold text-white">{userProgress.streak}</span>
                                </div>
                                <div className="w-px h-4 bg-gray-600"></div>
                                <div className="flex items-center" title="Total Points">
                                    <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                                    <span className="font-bold text-white">{userProgress.points}</span>
                                </div>
                            </div>
                        )}

                        <a
                            href="https://focusflow-server-wuud.onrender.com/app-release.apk"
                            download="FocusFlowAgent.apk"
                            className="flex items-center space-x-2 bg-brand-primary hover:bg-brand-accent text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                            title="Download Android Companion App"
                        >
                            <SmartphoneIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">Get App</span>
                        </a>

                        <button
                            onClick={onToggleSound}
                            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                            aria-label={isSoundEnabled ? "Disable sounds" : "Enable sounds"}
                        >
                            {isSoundEnabled ? (
                                <SoundOnIcon className="h-6 w-6" />
                            ) : (
                                <SoundOffIcon className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
