import React from 'react';

const INACTIVE_DEFAULT_TIMEOUT = 5 * 60 * 1000;

/**
 * Subscribes to document visibility and calls the callback when the tab becomes visible
 * after the user has been inactive for at least INACTIVE_DEFAULT_TIMEOUT (5 minutes).
 *
 * Used to re-validate the auth token when the user returns to the tab. If the token
 * is no longer valid, the backend responds with NEED_RESET, triggering a reload and
 * redirect to the auth form.
 *
 * @param onVisible - Callback invoked when the tab becomes visible after the inactivity threshold (e.g. whoami / token check)
 */
export function useHandleVisibilityChange(onVisible: () => void) {
    const inactiveSinceRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = document.visibilityState === 'visible';

            if (!isVisible) {
                inactiveSinceRef.current = Date.now();
            } else if (inactiveSinceRef.current !== null) {
                const timePassed = Date.now() - inactiveSinceRef.current;

                inactiveSinceRef.current = null;
                if (timePassed >= INACTIVE_DEFAULT_TIMEOUT) {
                    onVisible();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [onVisible]);
}
