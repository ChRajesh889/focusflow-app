import React, { useState } from 'react';
import { Intervention } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import ThumbsDownIcon from './icons/ThumbsDownIcon';

interface DistractionModalProps {
    isOpen: boolean;
    onClose: () => void;
    intervention: Intervention | null;
    isLoading: boolean;
    onFeedback: (wasHelpful: boolean) => void;
    distractionSource?: string;
}

const DistractionModal: React.FC<DistractionModalProps> = ({ isOpen, onClose, intervention, isLoading, onFeedback, distractionSource }) => {
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    if (!isOpen) return null;

    const handleFeedback = (wasHelpful: boolean) => {
        onFeedback(wasHelpful);
        setFeedbackGiven(true);
    };

    const handleClose = () => {
        setFeedbackGiven(false); // Reset for next time
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-md p-6 sm:p-8 transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className="bg-yellow-500/20 p-3 rounded-full mb-4">
                        <svg className="h-8 w-8 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Distraction Detected!</h2>
                    {distractionSource && (
                        <p className="text-gray-400 mb-4">
                            It looks like you got distracted by <span className="font-semibold text-gray-200">{distractionSource}</span>.
                        </p>
                    )}
                    
                    {isLoading ? (
                        <div className="animate-pulse space-y-4 my-6 w-full">
                            <div className="h-4 bg-gray-600 rounded w-3/4 mx-auto"></div>
                            <div className="h-4 bg-gray-600 rounded w-1/2 mx-auto"></div>
                            <div className="h-10 bg-gray-700 rounded w-full mt-6"></div>
                        </div>
                    ) : intervention ? (
                        <div className="my-6 w-full">
                            <p className="text-gray-300 italic">"{intervention.encouragement}"</p>
                            <div className="mt-6 bg-gray-800/50 p-4 rounded-lg text-left">
                                <h4 className="font-semibold flex items-center text-brand-accent">
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    AI Suggestion: {intervention.suggestion.title}
                                </h4>
                                <p className="text-gray-400 text-sm mt-1">{intervention.suggestion.description}</p>
                            </div>
                            
                            {!feedbackGiven ? (
                                <div className="mt-6">
                                    <p className="text-sm text-gray-400 mb-2">Was this suggestion helpful?</p>
                                    <div className="flex justify-center space-x-4">
                                        <button onClick={() => handleFeedback(true)} className="p-2 rounded-full bg-gray-700 hover:bg-green-600 transition-colors">
                                            <ThumbsUpIcon className="w-6 h-6 text-gray-300" />
                                        </button>
                                        <button onClick={() => handleFeedback(false)} className="p-2 rounded-full bg-gray-700 hover:bg-red-600 transition-colors">
                                            <ThumbsDownIcon className="w-6 h-6 text-gray-300" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-green-400 mt-6">Thank you for your feedback! The AI is learning.</p>
                            )}
                        </div>
                    ) : null}

                    <button
                        onClick={handleClose}
                        className="w-full py-3 px-6 text-lg font-bold text-white bg-brand-accent hover:bg-brand-accent-hover rounded-lg transition duration-300"
                    >
                        Refocus
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DistractionModal;