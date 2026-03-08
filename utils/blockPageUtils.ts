
import { BlockPageSettings } from "../types";

const createBlockPageHTML = (bodyContent: string, title: string, settings?: BlockPageSettings): string => {
    const accentColor = settings?.themeColor || '#4F46E5';

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
                tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                'brand-dark': '#111827',
                                'brand-secondary': '#1F2937',
                                'brand-light': '#F9FAFB',
                                'brand-accent': '${accentColor}',
                            },
                        },
                    },
                }
            </script>
            <style>
                .custom-bg-image {
                    background-image: url('${settings?.customImageUrl || ''}');
                    background-size: cover;
                    background-position: center;
                    filter: blur(8px);
                    position: absolute;
                    inset: 0;
                    opacity: 0.15;
                    z-index: -1;
                }
            </style>
        </head>
        <body class="bg-brand-dark text-brand-light flex items-center justify-center min-h-screen font-sans p-4 relative overflow-hidden">
            ${settings?.customImageUrl ? '<div class="custom-bg-image"></div>' : ''}
            <div class="bg-brand-secondary/90 backdrop-blur-sm p-8 rounded-lg shadow-2xl w-full max-w-2xl text-center border border-white/5 relative z-10">
                ${bodyContent}
            </div>
        </body>
        </html>
    `;
};

export const createFocusBlockPageHTML = (goal: string, timeLeftInSeconds: number, settings?: BlockPageSettings): string => {
    const shieldIconSVG = `
        <svg class="h-20 w-20 mx-auto text-brand-accent mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
        </svg>
    `;

    const goalIconSVG = `
        <svg class="w-6 h-6 mr-3 text-brand-accent flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.82m5.84-2.56a12.02 12.02 0 0 0-5.84-2.56V21m0-18v4.82a6 6 0 0 1 5.84 7.38m-5.84-2.56a12.02 12.02 0 0 1-5.84-2.56V3m0 18v-4.82a6 6 0 0 1-5.84-7.38m5.84 2.56a12.02 12.02 0 0 0 5.84 2.56" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        </svg>
    `;

    const sanitizedGoal = goal.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const displayMessage = settings?.customMessage || 'This site is temporarily blocked to help you concentrate.';

    const bodyContent = `
        <div id="block-content">
            ${shieldIconSVG}
            <h1 class="text-4xl font-bold text-white mb-3">Stay Focused!</h1>
            <p class="text-lg text-gray-300 mb-6">
                ${displayMessage.replace(/\n/g, '<br>')}
            </p>
            ${settings?.showTimer !== false ? `
            <div class="mb-6">
                <p class="text-gray-400 mb-2">Time Remaining</p>
                <p id="timer" class="text-6xl font-mono font-bold tracking-tighter"></p>
            </div>
            ` : ''}
            <div class="bg-gray-800/50 p-4 rounded-lg text-left mb-8">
                <div class="font-semibold flex items-center text-brand-accent">
                    ${goalIconSVG}
                    Your Current Goal:
                </div>
                <p class="text-gray-200 text-lg mt-2 italic pl-9 break-words">"${sanitizedGoal || 'your task'}"</p>
            </div>
            <p class="text-gray-400">Keep up the great work. You can visit this site after your focus session ends.</p>
        </div>
        <div id="complete-content" class="hidden">
             <svg class="h-20 w-20 mx-auto text-green-500 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 class="text-4xl font-bold text-white mb-3">Focus Session Complete!</h1>
            <p class="text-lg text-gray-300 mb-8">
                You can now access this site. This tab will close shortly.
            </p>
        </div>
        <script>
            let timeLeft = ${timeLeftInSeconds};
            const timerElement = document.getElementById('timer');
            const blockContent = document.getElementById('block-content');
            const completeContent = document.getElementById('complete-content');

            function formatTime(seconds) {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return \`\${String(mins).padStart(2, '0')}:\${String(secs).padStart(2, '0')}\`;
            }

            function updateTimer() {
                if (timerElement) {
                    timerElement.textContent = formatTime(timeLeft);
                }
            }

            const interval = setInterval(() => {
                timeLeft--;
                if (timeLeft >= 0) {
                    updateTimer();
                }
                
                if (timeLeft < 0) {
                    clearInterval(interval);
                    if (blockContent) blockContent.style.display = 'none';
                    if (completeContent) completeContent.style.display = 'block';
                    document.title = 'Session Complete!';
                    setTimeout(() => {
                        window.close();
                    }, 3000);
                }
            }, 1000);

            if (timerElement) updateTimer();
        </script>
    `;

    return createBlockPageHTML(bodyContent, 'Focus Session Active', settings);
};

export const createDailyLimitBlockPageHTML = (appName: string, appId: string, backendUrl: string, settings?: BlockPageSettings): string => {
    const shieldIconSVG = `
        <svg class="h-20 w-20 mx-auto text-brand-accent mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
        </svg>
    `;
    const sanitizedAppName = appName.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const bodyContent = `
        \${shieldIconSVG}
        <h1 class="text-4xl font-bold text-white mb-3">Time's Up!</h1>
        <p class="text-lg text-gray-300 mb-8">
            You've reached your daily time limit for <span class="font-bold text-white">\${sanitizedAppName}</span>.
        </p>

        <div class="flex flex-col gap-4 mt-8 mx-auto max-w-sm">
            <button id="snooze-btn" class="bg-brand-accent/20 hover:bg-brand-accent/40 text-brand-accent border border-brand-accent/50 py-3 px-6 rounded-lg font-semibold transition-colors duration-200 shadow-lg cursor-pointer">
                Snooze - Add 5 Minutes
            </button>
        </div>

        <p class="text-gray-400 mt-4 text-sm">Or come back tomorrow. Keep prioritizing your goals!</p>
        <p id="status-text" class="text-gray-500 text-xs mt-6">This tab will close automatically in 15 seconds.</p>

        <script>
            const snoozeBtn = document.getElementById('snooze-btn');
            const statusText = document.getElementById('status-text');
            let closeTimeout;

            function autoClose() {
                if(snoozeBtn.textContent === "Snooze - Add 5 Minutes") { 
                    window.close();
                }
            }
            
            closeTimeout = setTimeout(autoClose, 15000);
            
            snoozeBtn.addEventListener('click', async () => {
                clearTimeout(closeTimeout);
                snoozeBtn.disabled = true;
                snoozeBtn.textContent = 'Adding time...';
                snoozeBtn.classList.add('opacity-50', 'cursor-not-allowed');
                
                try {
                    const response = await fetch('\${backendUrl}/api/limits/extend', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ appId: '\${appId}', additionalMinutes: 5 })
                    });
                    
                    if (response.ok) {
                        snoozeBtn.textContent = 'Time added! Resume...';
                        snoozeBtn.classList.remove('bg-brand-accent/20', 'text-brand-accent', 'opacity-50', 'cursor-not-allowed', 'hover:bg-brand-accent/40');
                        snoozeBtn.classList.add('bg-green-500/50', 'text-white', 'border-green-500');
                        statusText.textContent = 'Redirecting...';
                        setTimeout(() => {
                            window.history.back();
                            setTimeout(() => window.close(), 500); 
                        }, 1000);
                    } else {
                        throw new Error('Failed to extend limit');
                    }
                } catch (error) {
                    console.error('Error extending time:', error);
                    snoozeBtn.textContent = 'Failed. Try again.';
                    snoozeBtn.disabled = false;
                    snoozeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    statusText.textContent = 'Error connecting to the FocusFlow backend.';
                    setTimeout(autoClose, 5000); 
                }
            });
        </script>
    `;

    return createBlockPageHTML(bodyContent, 'Daily Limit Reached', settings);
};
