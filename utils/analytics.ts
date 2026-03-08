
export type AnalyticsEvent = 
    | 'session_start' 
    | 'session_completed' 
    | 'session_stopped' 
    | 'badge_unlocked'
    | 'app_launch_blocked'
    | 'app_usage_session_end';

export const trackEvent = (eventName: AnalyticsEvent | string, properties?: Record<string, any>) => {
    // Placeholder for actual analytics integration (e.g., Google Analytics, Mixpanel, Amplitude)
    // For now, we simply log to the console in a structured way.
    if (process.env.NODE_ENV === 'development') {
        console.groupCollapsed(`📊 [Analytics] ${eventName}`);
        console.log('Properties:', properties);
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
    } else {
        // In production, this might look like:
        // window.gtag('event', eventName, properties);
        console.log(`[Analytics] ${eventName}`, properties);
    }
};
