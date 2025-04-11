import React from 'react';

import {AUTO_REFRESH_INTERVAL} from '../constants';

import {useSetting} from './useSetting';

const IMMEDIATE_UPDATE_INTERVAL = 1;
const DISABLED_INTERVAL = 0;

export function useAutoRefreshInterval(): [number, (value: number) => void] {
    const [settingValue, setSettingValue] = useSetting(AUTO_REFRESH_INTERVAL, DISABLED_INTERVAL);
    const [effectiveInterval, setEffectiveInterval] = React.useState(
        document.visibilityState === 'visible' ? settingValue : DISABLED_INTERVAL,
    );

    const lastHiddenTimeRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        setEffectiveInterval(document.visibilityState === 'visible' ? settingValue : 0);

        const handleVisibilityChange = () => {
            const isVisible = document.visibilityState === 'visible';
            if (isVisible) {
                // If more than settingValue milliseconds have passed since the page was hidden,
                // trigger an immediate update
                const shouldTriggerImmediate =
                    lastHiddenTimeRef.current &&
                    settingValue !== DISABLED_INTERVAL &&
                    Date.now() - lastHiddenTimeRef.current >= settingValue;

                if (shouldTriggerImmediate) {
                    setEffectiveInterval(IMMEDIATE_UPDATE_INTERVAL);

                    setTimeout(() => {
                        setEffectiveInterval(settingValue);
                    }, 0);
                } else {
                    setEffectiveInterval(settingValue);
                }

                lastHiddenTimeRef.current = null;
            } else {
                lastHiddenTimeRef.current = Date.now();
                setEffectiveInterval(DISABLED_INTERVAL);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [settingValue]);

    return [effectiveInterval, setSettingValue];
}
