
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { INITIAL_SOCIAL_APPS, BADGES, ICON_REGISTRY } from '../constants';
import AppSelector from './AppSelector';
import InsightsChart from './InsightsChart';
import { getNewProductiveSuggestions } from '../services/geminiService';
import { ProductiveSuggestion, AppInfo, ChartDataPoint, FocusSession, UserProgress, BlockPageSettings } from '../types';
import ProductiveSuggestions from './ProductiveSuggestions';
import { playBlockSound, playSound, SoundName } from '../utils/audioUtils';
import AppLauncher from './AppLauncher';
import UsagePage from './UsagePage';
import FocusSessionControl from './FocusSessionControl';
import Notification from './Notification';
import { createFocusBlockPageHTML, createDailyLimitBlockPageHTML } from '../utils/blockPageUtils';
import Features from './Features';
import FocusHistory from './FocusHistory';
import { useIdleTimer } from '../utils/idleTimer';
import AddAppModal from './AddAppModal';
import GlobeIcon from './icons/GlobeIcon';
import GamificationHub from './GamificationHub';
import DistractionBreakdown from './DistractionBreakdown';
import { trackEvent } from '../utils/analytics';
import BlockPageSettingsModal from './BlockPageSettingsModal';
import SlidersIcon from './icons/SlidersIcon';
import { launchApp } from '../utils/appLauncher';

const getIconComponent = (app: Partial<AppInfo>): React.FC<React.SVGProps<SVGSVGElement>> => {
    if (app.iconUrl) {
        return (props) => <img src={app.iconUrl} alt="" className={props.className} style={{ objectFit: 'cover', borderRadius: '4px' }} />;
    }
    if (app.iconId && ICON_REGISTRY[app.iconId]) {
        return ICON_REGISTRY[app.iconId];
    }
    return GlobeIcon;
};

interface HourlyStats { [hour: number]: { focus: number, distraction: number }; }
interface TodayStats { date: string; hourly: HourlyStats; }
interface DailyStats { [date: string]: { focus: number, distraction: number }; }
type InsightsView = 'day' | 'week' | 'month';
type MainView = 'dashboard' | 'usage';

interface DashboardProps {
    isSoundEnabled: boolean;
    userProgress: UserProgress;
    onUpdateProgress: (newProgress: UserProgress) => void;
}

const DEFAULT_BLOCK_PAGE_SETTINGS: BlockPageSettings = {
    customMessage: "This site is temporarily blocked to help you concentrate.",
    themeColor: "#4F46E5",
    showTimer: true
};

const Dashboard: React.FC<DashboardProps> = ({ isSoundEnabled, userProgress, onUpdateProgress }) => {
    const socketRef = useRef<Socket | null>(null);
    const appWindowsRef = useRef<{ [key: string]: Window | null }>({});
    const BACKEND_URL = "https://focusflow-server-wuud.onrender.com";
    const USER_ID = "demo_user_123";

    const [apps, setApps] = useState<AppInfo[]>(() => {
        try {
            const savedApps = window.localStorage.getItem('focusFlowApps');
            if (!savedApps) return INITIAL_SOCIAL_APPS;
            const parsed = JSON.parse(savedApps);

            // Auto-migrate old 'custom-timestamp' IDs to use clean names for Android blocking
            const migrated = parsed.map((app: any) => {
                if (app.id && app.id.startsWith('custom-')) {
                    const cleanName = app.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    // For specific tricky names
                    let finalId = cleanName;
                    if (cleanName.includes('chrome')) finalId = 'chrome';
                    if (cleanName.includes('spotify')) finalId = 'spotify';
                    if (finalId) app.id = finalId;
                }

                // Hydrate parsed apps with static config (icons, android package) from INITIAL_SOCIAL_APPS
                const staticApp = INITIAL_SOCIAL_APPS.find(a => a.id === app.id);
                if (staticApp) {
                    return {
                        ...app,
                        iconId: staticApp.iconId || app.iconId,
                        androidPackage: staticApp.androidPackage || app.androidPackage,
                        Icon: getIconComponent({ iconUrl: app.iconUrl, iconId: staticApp.iconId || app.iconId })
                    };
                }
                return { ...app, Icon: getIconComponent(app) };
            });
            return migrated;
        } catch (error) { return INITIAL_SOCIAL_APPS; }
    });

    const [appLimits, setAppLimits] = useState<{ [key: string]: number }>({});
    const [appUsage, setAppUsage] = useState<{ [key: string]: number }>({});
    const [recentlyUsedIds, setRecentlyUsedIds] = useState<string[]>(() => {
        try {
            const saved = window.localStorage.getItem('focusFlowRecentlyUsed');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const [blockPageSettings, setBlockPageSettings] = useState<BlockPageSettings>(() => {
        try {
            const saved = window.localStorage.getItem('focusFlowBlockPageSettings');
            return saved ? JSON.parse(saved) : DEFAULT_BLOCK_PAGE_SETTINGS;
        } catch (e) { return DEFAULT_BLOCK_PAGE_SETTINGS; }
    });

    const [productiveSuggestions, setProductiveSuggestions] = useState<ProductiveSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
    const [insightsView, setInsightsView] = useState<InsightsView>('week');
    const [currentView, setCurrentView] = useState<MainView>('dashboard');
    const [activeApp, setActiveApp] = useState<AppInfo | null>(null);
    const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
    const [isBlockSettingsModalOpen, setIsBlockSettingsModalOpen] = useState(false);

    const [isMobileConnected, setIsMobileConnected] = useState(false);
    const [mobileDeviceName, setMobileDeviceName] = useState('');

    const [isFocusing, setIsFocusing] = useState(false);
    const [isIdle, setIsIdle] = useState(false);
    const [idleTimeout, setIdleTimeout] = useState(300);
    const [focusApps, setFocusApps] = useState<string[]>([]);
    const [focusDuration, setFocusDuration] = useState(25 * 60);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [focusGoal, setFocusGoal] = useState('');
    const [syncToCalendar, setSyncToCalendar] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' | 'calendar' | 'block' | 'achievement', app?: AppInfo, badgeName?: string } | null>(null);

    const [dailyStats, setDailyStats] = useState<DailyStats>(() => JSON.parse(window.localStorage.getItem('focusFlowDailyStats') || '{}'));
    const [todayStats, setTodayStats] = useState<TodayStats>(() => ({ date: new Date().toISOString().split('T')[0], hourly: {} }));
    const [focusHistory, setFocusHistory] = useState<FocusSession[]>(() => JSON.parse(window.localStorage.getItem('focusFlowHistory') || '[]'));

    const chartData = useMemo(() => getChartData(insightsView, todayStats, dailyStats), [insightsView, todayStats, dailyStats]);

    const recentlyUsedApps = useMemo(() => {
        return recentlyUsedIds
            .map(id => apps.find(a => a.id === id))
            .filter((app): app is AppInfo => !!app)
            .slice(0, 5);
    }, [recentlyUsedIds, apps]);

    const handleCloseAppTab = useCallback((appId: string) => {
        const win = appWindowsRef.current[appId];
        if (win && !win.closed) {
            try {
                win.close();
            } catch (e) {
                console.error("Failed to close tab:", e);
            }
            appWindowsRef.current[appId] = null;
        }
    }, []);

    const updateRecentlyUsed = useCallback((appId: string) => {
        setRecentlyUsedIds(prev => {
            const filtered = prev.filter(id => id !== appId);
            const newList = [appId, ...filtered].slice(0, 10);
            window.localStorage.setItem('focusFlowRecentlyUsed', JSON.stringify(newList));
            return newList;
        });
    }, []);

    const updateFocusStats = useCallback((minutes: number) => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentHour = now.getHours();

        setDailyStats(prev => {
            const newStats = { ...prev };
            if (!newStats[todayStr]) newStats[todayStr] = { focus: 0, distraction: 0 };
            newStats[todayStr].focus += minutes;
            return newStats;
        });

        setTodayStats(prev => {
            const newStats = { ...prev, hourly: { ...prev.hourly } };
            if (newStats.date !== todayStr) {
                newStats.date = todayStr;
                newStats.hourly = {};
            }
            if (!newStats.hourly[currentHour]) newStats.hourly[currentHour] = { focus: 0, distraction: 0 };
            newStats.hourly[currentHour].focus += minutes;
            return newStats;
        });
    }, []);

    const handleFocusEnd = useCallback((wasStopped = false) => {
        setIsFocusing(false);
        if (isSoundEnabled) playSound('Chime');
        const minutesFocused = Math.floor((focusDuration - timeLeft) / 60);

        if (minutesFocused > 0) {
            updateFocusStats(minutesFocused);
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const pointsEarned = Math.floor(minutesFocused * 1);
            const newTotalFocusMinutes = userProgress.totalFocusMinutes + minutesFocused;
            const newSessionsCompleted = userProgress.sessionsCompleted + (wasStopped ? 0 : 1);

            let newStreak = userProgress.streak;
            if (userProgress.lastActiveDate !== todayStr) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                if (userProgress.lastActiveDate === yesterdayStr) newStreak += 1;
                else newStreak = 1;
            }

            const currentBadgeIds = new Set(userProgress.badges);
            const tempStats: UserProgress = {
                ...userProgress,
                totalFocusMinutes: newTotalFocusMinutes,
                sessionsCompleted: newSessionsCompleted,
                streak: newStreak,
                points: userProgress.points + pointsEarned
            };

            BADGES.forEach(badge => {
                if (!currentBadgeIds.has(badge.id) && badge.condition(tempStats)) {
                    currentBadgeIds.add(badge.id);
                }
            });

            onUpdateProgress({ ...tempStats, badges: Array.from(currentBadgeIds), lastActiveDate: todayStr });
        }

        socketRef.current?.emit('session:stop');

        setFocusHistory(prev => [...prev, {
            id: new Date().toISOString(),
            goal: focusGoal,
            duration: focusDuration,
            completedDuration: focusDuration - timeLeft,
            date: new Date().toISOString(),
            appsBlocked: focusApps,
            status: wasStopped ? 'stopped' : 'completed',
            interventions: []
        }]);

        setNotification({
            message: wasStopped ? "Session stopped early." : `You completed a ${minutesFocused}-minute focus session.`,
            type: wasStopped ? 'info' : 'success'
        });

        setTimeLeft(focusDuration);
        setTimeout(() => setNotification(null), 5000);
    }, [focusDuration, timeLeft, focusGoal, isSoundEnabled, focusApps, userProgress, onUpdateProgress, updateFocusStats]);

    useEffect(() => {
        let interval: number | null = null;
        if (isFocusing && !isIdle && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isFocusing && timeLeft <= 0) {
            handleFocusEnd(false);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isFocusing, isIdle, timeLeft, handleFocusEnd]);

    useIdleTimer({
        onIdle: () => setIsIdle(true),
        onActive: () => setIsIdle(false),
        timeout: idleTimeout,
        enabled: isFocusing && idleTimeout > 0,
    });

    useEffect(() => {
        const socket = io(BACKEND_URL, { query: { userId: USER_ID, platform: 'web' } });
        socketRef.current = socket;
        socket.on('sync:initial', (data) => {
            setAppLimits(prev => ({ ...prev, ...data.limits }));
            setAppUsage(prev => ({ ...prev, ...data.usage }));
        });
        socket.on('sync:limit_changed', ({ appId, limitMins }) => {
            setAppLimits(prev => ({ ...prev, [appId]: limitMins }));
        });
        socket.on('sync:usage_increment', ({ appId, incrementSecs }) => {
            setAppUsage(prev => ({ ...prev, [appId]: (prev[appId] || 0) + incrementSecs }));
        });
        socket.on('sync:android_status', (data) => {
            if (data && typeof data.connected === 'boolean') {
                setIsMobileConnected(data.connected);
                if (data.deviceName) {
                    setMobileDeviceName(data.deviceName);
                }
            }
        });
        socket.on('command:block_apps', (data) => {
            // Close any open tabs for apps that are now being blocked
            if (data.apps && Array.isArray(data.apps)) {
                data.apps.forEach((appId: string) => {
                    handleCloseAppTab(appId);
                });
            }

            if (!isFocusing) {
                setFocusGoal(data.goal);
                setFocusApps(data.apps);
                setFocusDuration(data.duration);
                const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
                setTimeLeft(Math.max(0, data.duration - elapsed));
                setIsFocusing(true);

                if (data.initiatorPlatform && data.initiatorPlatform !== 'web') {
                    setNotification({
                        message: `Focus session started from your ${data.initiatorPlatform} device.`,
                        type: 'info'
                    });
                    setTimeout(() => setNotification(null), 5000);
                }
            }
        });
        socket.on('command:unblock_apps', () => { if (isFocusing) setIsFocusing(false); });
        return () => { socket.disconnect(); };
    }, [isFocusing, handleCloseAppTab]);

    // Global Usage Watchdog: Proactively close tabs if limits are hit
    useEffect(() => {
        Object.keys(appLimits).forEach(appId => {
            const limitSecs = appLimits[appId] * 60;
            const usageSecs = appUsage[appId] || 0;
            if (limitSecs > 0 && usageSecs >= limitSecs) {
                handleCloseAppTab(appId);
            }
        });
    }, [appUsage, appLimits, handleCloseAppTab]);

    const handleSetAppLimit = (appId: string, limit: number) => {
        setAppLimits(prev => ({ ...prev, [appId]: limit }));
        socketRef.current?.emit('limit:update', { appId, limitMins: limit });
        updateRecentlyUsed(appId);
    };

    const handleRemoveApp = (appId: string) => {
        if (window.confirm('Are you sure you want to remove this app?')) {
            setApps(prev => prev.filter(app => app.id !== appId));
            setRecentlyUsedIds(prev => prev.filter(id => id !== appId));
            setFocusApps(prev => prev.filter(id => id !== appId));
        }
    };

    const handleStartFocus = () => {
        setTimeLeft(focusDuration);
        setIsFocusing(true);
        socketRef.current?.emit('session:start', { goal: focusGoal, duration: focusDuration, appsBlocked: focusApps });
        if (isSoundEnabled) playSound('Bell');
    };

    const handleStopFocus = () => {
        handleFocusEnd(true);
        socketRef.current?.emit('session:stop');
    };

    const handleReportUsage = useCallback((appId: string, timeSpentSeconds: number) => {
        socketRef.current?.emit('usage:update', { appId, incrementSecs: timeSpentSeconds });
        setAppUsage(prev => ({ ...prev, [appId]: (prev[appId] || 0) + timeSpentSeconds }));
    }, []);

    const handleLeaveUsagePage = useCallback(() => {
        setCurrentView('dashboard');
        setActiveApp(null);
    }, []);

    useEffect(() => {
        window.localStorage.setItem('focusFlowDailyStats', JSON.stringify(dailyStats));
        window.localStorage.setItem('focusFlowTodayStats', JSON.stringify(todayStats));
        window.localStorage.setItem('focusFlowHistory', JSON.stringify(focusHistory));
        window.localStorage.setItem('focusFlowBlockPageSettings', JSON.stringify(blockPageSettings));
        window.localStorage.setItem('focusFlowApps', JSON.stringify(apps.map(a => ({ ...a, Icon: undefined }))));
    }, [dailyStats, todayStats, focusHistory, blockPageSettings, apps]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoadingSuggestions(true);
            const suggestions = await getNewProductiveSuggestions();
            setProductiveSuggestions(suggestions);
            setIsLoadingSuggestions(false);
        };
        fetchSuggestions();
    }, []);

    const allCategories = useMemo(() => Array.from(new Set(apps.map(app => app.category))).sort(), [apps]);

    const handleAddNewApp = (newApp: any) => {
        // Generate a clean ID for Android package matching (e.g. "WhatsApp" -> "whatsapp")
        let generatedId = newApp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!generatedId) generatedId = `custom-${Date.now()}`;

        // Anti-collision (if they add it twice)
        if (apps.some(a => a.id === generatedId)) {
            generatedId = `${generatedId}-${Date.now().toString().slice(-3)}`;
        }

        const newAppInfo: AppInfo = {
            id: generatedId,
            ...newApp,
            Icon: getIconComponent({ iconUrl: newApp.iconUrl })
        };
        setApps(prev => [...prev, newAppInfo]);
        setIsAddAppModalOpen(false);
    };

    const handleAppLaunchAttempt = (appId: string) => {
        const app = apps.find(a => a.id === appId);
        if (!app) return;
        updateRecentlyUsed(appId);

        if (isFocusing && focusApps.includes(appId)) {
            if (isSoundEnabled) playBlockSound();
            setNotification({ message: `This app is blocked during focus.`, type: 'block', app: app });

            // Still navigate to usage page so the user sees the block state in-app as well
            setActiveApp(app);
            setCurrentView('usage');
            return;
        }

        const limitInSeconds = (appLimits[appId] || 0) * 60;
        const usageInSeconds = appUsage[appId] || 0;

        if (limitInSeconds > 0 && usageInSeconds >= limitInSeconds) {
            if (isSoundEnabled) playBlockSound();
            setNotification({ message: `Daily limit reached for ${app.name}.`, type: 'block', app: app });

            setActiveApp(app);
            setCurrentView('usage');
            return;
        } else {
            // Check if we already have an open tab for this app
            const existingWin = appWindowsRef.current[app.id];
            if (existingWin && !existingWin.closed) {
                existingWin.focus();
            } else {
                // Open the actual app using intent URLs for Android or specific tab for Desktop
                const win = launchApp(app);
                if (win) {
                    appWindowsRef.current[app.id] = win;
                }
            }
        }

        setActiveApp(app);
        setCurrentView('usage');
    };



    if (currentView === 'usage' && activeApp) {
        return (
            <UsagePage
                app={activeApp}
                timeLimitSeconds={(appLimits[activeApp.id] || 0) * 60}
                timeUsedSeconds={appUsage[activeApp.id] || 0}
                onLeave={handleLeaveUsagePage}
                onReportUsage={(secs) => handleReportUsage(activeApp.id, secs)}
                onCloseTab={() => handleCloseAppTab(activeApp.id)}
                onLaunchApp={() => handleAppLaunchAttempt(activeApp.id)}
                isBlockedByFocus={isFocusing && focusApps.includes(activeApp.id)}
                backendUrl={BACKEND_URL}
                userId={USER_ID}
            />
        );
    }

    return (
        <div className="space-y-8 p-4">
            {notification && <Notification message={notification.message} type={notification.type} app={notification.app} onClose={() => setNotification(null)} badgeName={notification.badgeName} />}
            <AddAppModal isOpen={isAddAppModalOpen} onClose={() => setIsAddAppModalOpen(false)} onAddApp={handleAddNewApp} existingCategories={allCategories} />
            <BlockPageSettingsModal isOpen={isBlockSettingsModalOpen} onClose={() => setIsBlockSettingsModalOpen(false)} settings={blockPageSettings} onSave={setBlockPageSettings} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-brand-secondary p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-3xl font-bold">Digital Wellbeing Hub</h1>
                        <div className="flex items-center space-x-3">
                            <button onClick={() => setIsBlockSettingsModalOpen(true)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg transition-colors border border-gray-700">
                                <SlidersIcon className="w-5 h-5" />
                            </button>
                            <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                                SYNC ACTIVE
                            </span>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <AppSelector
                            apps={apps}
                            recentlyUsedApps={recentlyUsedApps}
                            limits={appLimits}
                            onSetLimit={handleSetAppLimit}
                            usage={appUsage}
                            focusApps={focusApps}
                            onToggleFocusApp={id => setFocusApps(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])}
                            isFocusing={isFocusing}
                            onUpdateAppCategory={(id, cat) => setApps(p => p.map(a => a.id === id ? { ...a, category: cat } : a))}
                            onOpenAddAppModal={() => setIsAddAppModalOpen(true)}
                            onAppClick={handleAppLaunchAttempt}
                            onRemoveApp={handleRemoveApp}
                        />
                        <FocusSessionControl
                            isFocusing={isFocusing}
                            onStart={handleStartFocus}
                            onStop={handleStopFocus}
                            timeLeft={timeLeft}
                            hasSelectedApps={focusApps.length > 0}
                            goal={focusGoal}
                            onGoalChange={setFocusGoal}
                            duration={focusDuration}
                            onDurationChange={setFocusDuration}
                            syncToCalendar={syncToCalendar}
                            onSyncToCalendarChange={setSyncToCalendar}
                            startSound="Bell"
                            onStartSoundChange={() => { }}
                            endSound="Chime"
                            onEndSoundChange={() => { }}
                            isIdle={isIdle}
                            idleTimeout={idleTimeout}
                            onIdleTimeoutChange={setIdleTimeout}
                        />
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <GamificationHub progress={userProgress} />
                    <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Focus Insights</h2>
                        <InsightsChart data={chartData} xAxisDataKey={insightsView === 'day' ? 'hour' : 'day'} />
                        <DistractionBreakdown appUsage={appUsage} apps={apps} />
                    </div>
                    <ProductiveSuggestions suggestions={productiveSuggestions} isLoading={isLoadingSuggestions} />
                    <FocusHistory sessions={focusHistory} apps={apps} />
                </div>
            </div>
            <AppLauncher apps={apps} onAppClick={handleAppLaunchAttempt} />
            <Features />
        </div>
    );
};

const getChartData = (insightsView: InsightsView, todayStats: TodayStats, dailyStats: DailyStats): ChartDataPoint[] => {
    const now = new Date();
    if (insightsView === 'day') {
        const data: ChartDataPoint[] = [];
        for (let hour = 0; hour < 24; hour++) {
            const stats = todayStats.hourly[hour] || { focus: 0, distraction: 0 };
            const period = hour < 12 ? 'am' : 'pm';
            let displayHour = hour % 12 || 12;
            data.push({ hour: `${displayHour}${period}`, ...stats });
        }
        return data;
    }
    const data: ChartDataPoint[] = [];
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const stats = dailyStats[dateStr] || { focus: 0, distraction: 0 };
        data.push({ day: dayMap[d.getDay()], ...stats });
    }
    return data;
};

export default Dashboard;
