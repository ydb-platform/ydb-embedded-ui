import React from 'react';

let inactiveSince: null | number = null;
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
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = document.visibilityState === 'visible';

            if (!isVisible) {
                inactiveSince = Date.now();
            } else {
                if (inactiveSince) {
                    const timePassed = Date.now() - inactiveSince;
                    if (timePassed >= INACTIVE_DEFAULT_TIMEOUT) {
                        onVisible();
                    }
                    inactiveSince = null;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [onVisible]);
}
