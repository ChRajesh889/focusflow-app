import React from 'react';
import { ProductiveSuggestion } from '../types';
import SparklesIcon from './icons/SparklesIcon';

interface ProductiveSuggestionsProps {
    suggestions: ProductiveSuggestion[];
    isLoading: boolean;
}

const ProductiveSuggestions: React.FC<ProductiveSuggestionsProps> = ({ suggestions, isLoading }) => {
    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <SparklesIcon className="w-6 h-6 mr-2 text-brand-accent" />
                Productive Alternatives
            </h2>
            {isLoading ? (
                 <ul className="space-y-3 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <li key={i} className="bg-gray-700/50 p-3 rounded-md">
                            <div className="h-4 bg-gray-600 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-600 rounded w-full"></div>
                        </li>
                    ))}
                </ul>
            ) : (
                <ul className="space-y-3">
                    {suggestions.map((s, index) => (
                        <li key={index} className="bg-gray-700/50 p-3 rounded-md">
                            <p className="font-semibold text-white">{s.title}</p>
                            <p className="text-sm text-gray-400">{s.description}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ProductiveSuggestions;