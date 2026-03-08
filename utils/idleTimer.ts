import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerProps {
  onIdle: () => void;
  onActive: () => void;
  timeout: number; // in seconds
  enabled: boolean;
}

export const useIdleTimer = ({ onIdle, onActive, timeout, enabled }: UseIdleTimerProps) => {
  const timerRef = useRef<number | null>(null);
  const idleStateRef = useRef(false);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      idleStateRef.current = true;
      onIdle();
    }, timeout * 1000);
  }, [onIdle, timeout]);

  const handleEvent = useCallback(() => {
    if (idleStateRef.current) {
      idleStateRef.current = false;
      onActive();
    }
    startTimer();
  }, [onActive, startTimer]);
  
  const cleanup = useCallback(() => {
      if (timerRef.current) {
          window.clearTimeout(timerRef.current);
      }
      const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
      events.forEach(event => window.removeEventListener(event, handleEvent));
  }, [handleEvent]);

  useEffect(() => {
    if (!enabled || timeout <= 0) {
      cleanup();
      return;
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    
    startTimer();
    events.forEach(event => window.addEventListener(event, handleEvent));

    return cleanup;
  }, [enabled, timeout, handleEvent, startTimer, cleanup]);
};
