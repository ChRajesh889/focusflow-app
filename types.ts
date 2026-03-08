
import React from 'react';

export interface AppInfo {
    id: string;
    name: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    iconId?: string; // To re-hydrate icons on refresh
    iconUrl?: string; // For custom uploaded icons (base64)
    url: string;
    category: string;
    androidPackage?: string; // App package for android deep linking
}

export interface ProductiveSuggestion {
    title: string;
    description: string;
}

export interface Intervention {
    encouragement: string;
    suggestion: ProductiveSuggestion;
}

export interface ChartDataPoint {
    [key: string]: string | number;
    focus: number;
    distraction: number;
}

export interface FocusSession {
    id: string;
    goal: string;
    duration: number; // planned duration in seconds
    completedDuration: number; // actual duration in seconds
    date: string; // ISO string
    appsBlocked: string[];
    status: 'completed' | 'stopped';
    interventions: Intervention[];
}

export interface UserProgress {
    points: number;
    streak: number;
    lastActiveDate: string; // YYYY-MM-DD
    badges: string[]; // Array of Badge IDs
    totalFocusMinutes: number;
    sessionsCompleted: number;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: 'trophy' | 'star' | 'fire' | 'check'; // Simple icon mapping
    condition: (stats: UserProgress) => boolean;
}

export interface BlockPageSettings {
    customMessage: string;
    customImageUrl?: string;
    themeColor: string;
    showTimer: boolean;
}
