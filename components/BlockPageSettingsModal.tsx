
import React, { useState } from 'react';
import { BlockPageSettings } from '../types';
import SlidersIcon from './icons/SlidersIcon';
import PlusIcon from './icons/PlusIcon';

interface BlockPageSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: BlockPageSettings;
    onSave: (settings: BlockPageSettings) => void;
}

const THEME_COLORS = [
    { name: 'Indigo', value: '#4F46E5' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Sky', value: '#0EA5E9' },
    { name: 'Rose', value: '#E11D48' },
];

const BlockPageSettingsModal: React.FC<BlockPageSettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState<BlockPageSettings>(settings);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024 * 3) {
                setError('Background image too large (max 3MB).');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings({ ...localSettings, customImageUrl: reader.result as string });
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-lg p-6 sm:p-8 transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <SlidersIcon className="w-6 h-6 mr-3 text-brand-accent" />
                        Customize Block Page
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Custom Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Motivation Message</label>
                        <textarea
                            value={localSettings.customMessage}
                            onChange={(e) => setLocalSettings({ ...localSettings, customMessage: e.target.value })}
                            placeholder="What should you be doing instead?"
                            className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors min-h-[100px] text-sm"
                        />
                    </div>

                    {/* Theme Color Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Theme Color</label>
                        <div className="flex flex-wrap gap-3">
                            {THEME_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => setLocalSettings({ ...localSettings, themeColor: color.value })}
                                    className={`w-10 h-10 rounded-full border-4 transition-all ${localSettings.themeColor === color.value ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Custom Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Custom Background Image</label>
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 w-24 h-16 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 overflow-hidden relative group">
                                {localSettings.customImageUrl ? (
                                    <img src={localSettings.customImageUrl} alt="Background Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <PlusIcon className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500" />
                                )}
                            </div>
                            <div className="flex-grow">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer"
                                />
                                {localSettings.customImageUrl && (
                                    <button 
                                        onClick={() => setLocalSettings({ ...localSettings, customImageUrl: undefined })}
                                        className="mt-2 text-[10px] text-red-400 hover:underline"
                                    >
                                        Remove Image
                                    </button>
                                )}
                            </div>
                        </div>
                        {error && <p className="text-xs text-red-400 mt-2 font-bold uppercase">{error}</p>}
                    </div>

                    {/* Toggle Settings */}
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-300">Show Countdown Timer</span>
                        <button 
                            onClick={() => setLocalSettings({ ...localSettings, showTimer: !localSettings.showTimer })}
                            className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.showTimer ? 'bg-brand-accent' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${localSettings.showTimer ? 'left-5.5' : 'left-0.5'}`}></div>
                        </button>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-700">
                    <button onClick={onClose} className="px-6 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 text-sm font-bold text-white rounded-lg bg-brand-accent hover:bg-brand-accent-hover transition-colors shadow-lg"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlockPageSettingsModal;
