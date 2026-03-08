
import React from 'react';
import CheckIcon from './icons/CheckIcon';
import InfoIcon from './icons/InfoIcon';
import CalendarIcon from './icons/CalendarIcon';
import { AppInfo } from '../types';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import TrophyIcon from './icons/TrophyIcon';

interface NotificationProps {
    message: string;
    type: 'success' | 'info' | 'calendar' | 'block' | 'achievement';
    onClose: () => void;
    app?: AppInfo;
    badgeName?: string;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose, app, badgeName }) => {
    
    const getTitle = () => {
        switch (type) {
            case 'success':
                return 'Focus Session Complete!';
            case 'info':
                return 'Focus Session Started!';
            case 'calendar':
                return 'Session Scheduled!';
            case 'block':
                return `${app?.name || 'App'} Blocked`;
            case 'achievement':
                return 'Achievement Unlocked!';
            default:
                return 'Notification';
        }
    };

    const getIcon = () => {
        if (app) {
            return <app.Icon className="h-8 w-8 text-gray-300" />;
        }
        
        switch (type) {
            case 'success':
                return <div className="bg-green-100 p-1 rounded-full"><CheckIcon className="h-5 w-5 text-green-600" /></div>;
            case 'info':
                return <div className="bg-blue-100 p-1 rounded-full"><InfoIcon className="h-5 w-5 text-blue-600" /></div>;
            case 'calendar':
                return <div className="bg-indigo-100 p-1 rounded-full"><CalendarIcon className="h-5 w-5 text-indigo-600" /></div>;
            case 'block':
                 return <div className="bg-red-100 p-1 rounded-full"><ShieldCheckIcon className="h-5 w-5 text-red-600" /></div>;
            case 'achievement':
                 return <div className="bg-yellow-100 p-1 rounded-full"><TrophyIcon className="h-5 w-5 text-yellow-600" /></div>;
            default:
                return null;
        }
    }

    return (
        <div 
            className="fixed top-20 right-5 z-50 animate-fade-in-down w-full max-w-sm"
            role="alert"
            aria-live="assertive"
        >
            <div className={`bg-brand-secondary shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${type === 'achievement' ? 'border-yellow-500' : 'border-transparent'}`}>
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8">
                           {getIcon()}
                        </div>
                        <div className="ml-3 w-0 flex-1 pt-0.5">
                            <p className="text-sm font-medium text-white">{getTitle()}</p>
                            <p className="mt-1 text-sm text-gray-400">{message}</p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button
                                onClick={onClose}
                                className="inline-flex text-gray-400 rounded-md hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-accent"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notification;
