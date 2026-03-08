
import React from 'react';
import { AppInfo, Badge } from './types';
import TwitterIcon from './components/icons/TwitterIcon';
import InstagramIcon from './components/icons/InstagramIcon';
import FacebookIcon from './components/icons/FacebookIcon';
import SnapchatIcon from './components/icons/SnapchatIcon';
import YoutubeIcon from './components/icons/YoutubeIcon';
import WhatsappIcon from './components/icons/WhatsappIcon';
import GlobeIcon from './components/icons/GlobeIcon';

export const ICON_REGISTRY: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'twitter': TwitterIcon,
    'instagram': InstagramIcon,
    'facebook': FacebookIcon,
    'snapchat': SnapchatIcon,
    'youtube': YoutubeIcon,
    'whatsapp': WhatsappIcon,
    'globe': GlobeIcon
};

export const INITIAL_SOCIAL_APPS: AppInfo[] = [
    { id: 'twitter', name: 'X (Twitter)', Icon: TwitterIcon, iconId: 'twitter', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg', url: 'https://x.com', category: 'Social Media & Content', androidPackage: 'com.twitter.android' },
    { id: 'instagram', name: 'Instagram', Icon: InstagramIcon, iconId: 'instagram', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg', url: 'https://www.instagram.com', category: 'Social Media & Content', androidPackage: 'com.instagram.android' },
    { id: 'facebook', name: 'Facebook', Icon: FacebookIcon, iconId: 'facebook', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg', url: 'https://www.facebook.com', category: 'Social Media & Content', androidPackage: 'com.facebook.katana' },
    { id: 'snapchat', name: 'Snapchat', Icon: SnapchatIcon, iconId: 'snapchat', iconUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c4/Snapchat_logo.svg', url: 'https://www.snapchat.com', category: 'Social Media & Content', androidPackage: 'com.snapchat.android' },
    { id: 'youtube', name: 'Youtube', Icon: YoutubeIcon, iconId: 'youtube', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg', url: 'https://www.youtube.com', category: 'Entertainment', androidPackage: 'com.google.android.youtube' },
    { id: 'whatsapp', name: 'WhatsApp', Icon: WhatsappIcon, iconId: 'whatsapp', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg', url: 'https://web.whatsapp.com', category: 'Messaging', androidPackage: 'com.whatsapp' },
];

export const BADGES: Badge[] = [
    {
        id: 'first_step',
        name: 'First Step',
        description: 'Complete your first focus session.',
        icon: 'check',
        condition: (stats) => stats.sessionsCompleted >= 1
    },
    {
        id: 'focused',
        name: 'In The Zone',
        description: 'Accumulate 100 minutes of total focus time.',
        icon: 'star',
        condition: (stats) => stats.totalFocusMinutes >= 100
    },
    {
        id: 'streak_master',
        name: 'On Fire',
        description: 'Achieve a 3-day streak.',
        icon: 'fire',
        condition: (stats) => stats.streak >= 3
    },
    {
        id: 'deep_diver',
        name: 'Deep Diver',
        description: 'Accumulate 500 minutes of total focus time.',
        icon: 'trophy',
        condition: (stats) => stats.totalFocusMinutes >= 500
    },
    {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Achieve a 7-day streak.',
        icon: 'fire',
        condition: (stats) => stats.streak >= 7
    },
    {
        id: 'point_collector',
        name: 'Point Collector',
        description: 'Earn 500 points.',
        icon: 'star',
        condition: (stats) => stats.points >= 500
    }
];
