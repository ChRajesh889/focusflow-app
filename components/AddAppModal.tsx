
import React, { useState, useEffect } from 'react';
import PlusIcon from './icons/PlusIcon';
import GlobeIcon from './icons/GlobeIcon';

interface AddAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddApp: (app: { name: string; url: string; category: string; iconUrl?: string }) => void;
    existingCategories: string[];
}

const isValidUrl = (urlString: string): boolean => {
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        return false;
    }
    try {
        new URL(urlString);
        return true;
    } catch (_) {
        return false;
    }
};

const AddAppModal: React.FC<AddAppModalProps> = ({ isOpen, onClose, onAddApp, existingCategories }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState(existingCategories[0] || 'Uncategorized');
    const [newCategory, setNewCategory] = useState('');
    const [iconUrl, setIconUrl] = useState<string | undefined>(undefined);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setName('');
            setUrl('');
            setCategory(existingCategories[0] || 'Uncategorized');
            setNewCategory('');
            setIconUrl(undefined);
            setError('');
        }
    }, [isOpen, existingCategories]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024 * 2) { // 2MB limit for base64 storage
                setError('Icon file size too large (max 2MB).');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setIconUrl(reader.result as string);
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('App name is required.');
            return;
        }

        if (!url.trim()) {
            setError('App URL is required.');
            return;
        }

        if (!isValidUrl(url.trim())) {
            setError('Please enter a valid URL (e.g., https://example.com).');
            return;
        }

        let finalCategory = category;
        if (category === '__CREATE_NEW__') {
            if (!newCategory.trim()) {
                setError('New category name cannot be empty.');
                return;
            }
            finalCategory = newCategory.trim();
        }

        onAddApp({ name: name.trim(), url: url.trim(), category: finalCategory, iconUrl: iconUrl });
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-app-title"
        >
            <div 
                className="bg-brand-secondary rounded-lg shadow-2xl w-full max-w-md p-6 sm:p-8 transform transition-all max-h-[90vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 id="add-app-title" className="text-2xl font-bold text-white flex items-center">
                           <PlusIcon className="w-6 h-6 mr-3 text-brand-accent"/>
                           Add Custom App
                        </h2>
                        <button
                            onClick={onClose}
                            className="inline-flex text-gray-400 rounded-md hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-accent"
                            aria-label="Close"
                        >
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Icon Upload & Preview */}
                        <div className="flex items-center space-x-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                            <div className="flex-shrink-0 w-20 h-20 bg-gray-900 border-2 border-dashed border-gray-600 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                                {iconUrl ? (
                                    <img src={iconUrl} alt="App Icon Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <GlobeIcon className="w-10 h-10 text-gray-600" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <PlusIcon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="flex-grow">
                                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-tight">App Icon</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-xs text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-xs file:font-bold
                                        file:bg-brand-accent file:text-white
                                        hover:file:bg-brand-accent-hover cursor-pointer"
                                />
                                <p className="mt-1 text-[10px] text-gray-500 italic">Recommended: Square PNG/JPG, max 2MB.</p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="app-name" className="block text-sm font-medium text-gray-300 mb-2">App Name</label>
                            <input
                                id="app-name"
                                type="text"
                                placeholder="e.g., News Site"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-800 border-2 border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="app-url" className="block text-sm font-medium text-gray-300 mb-2">App URL</label>
                            <input
                                id="app-url"
                                type="url"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full bg-gray-800 border-2 border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="app-category" className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                            <select
                                id="app-category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-gray-800 border-2 border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors"
                            >
                                {existingCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                                <option value="__CREATE_NEW__" className="text-brand-accent font-semibold">Create New...</option>
                            </select>
                        </div>
                        {category === '__CREATE_NEW__' && (
                             <div className="animate-fade-in">
                                <label htmlFor="new-category-name" className="block text-sm font-medium text-gray-300 mb-2">New Category Name</label>
                                <input
                                    id="new-category-name"
                                    type="text"
                                    placeholder="e.g., News & Articles"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="w-full bg-gray-800 border-2 border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent transition-colors"
                                />
                            </div>
                        )}
                        
                        <div className="h-4 mt-2">
                             {error && <p className="text-xs text-center text-red-400 animate-fade-in font-bold uppercase">{error}</p>}
                        </div>

                        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="py-2.5 px-6 text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                             <button
                                type="submit"
                                className="py-2.5 px-6 text-sm font-bold text-white bg-brand-accent hover:bg-brand-accent-hover rounded-xl shadow-lg shadow-brand-accent/20 transition duration-300"
                            >
                                Create App
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddAppModal;
