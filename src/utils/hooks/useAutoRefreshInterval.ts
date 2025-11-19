import React from 'react';

import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useSetting} from '../../store/reducers/settings/useSetting';

const IMMEDIATE_UPDATE_INTERVAL = 1;
const DISABLED_INTERVAL = 0;

export function useAutoRefreshInterval(): [number, (value: number) => void] {
    const {value, saveValue: setSettingValue} = useSetting<number>(
        SETTING_KEYS.AUTO_REFRESH_INTERVAL,
    );
    const intervalValue = value ?? DISABLED_INTERVAL;

    const [effectiveInterval, setEffectiveInterval] = React.useState(
        document.visibilityState === 'visible' ? intervalValue : DISABLED_INTERVAL,
    );

    const lastHiddenTimeRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        setEffectiveInterval(document.visibilityState === 'visible' ? intervalValue : 0);

        const handleVisibilityChange = () => {
            const isVisible = document.visibilityState === 'visible';
            if (isVisible) {
                // If more than intervalValue milliseconds have passed since the page was hidden,
                // trigger an immediate update
                const shouldTriggerImmediate =
                    lastHiddenTimeRef.current &&
                    intervalValue !== DISABLED_INTERVAL &&
                    Date.now() - lastHiddenTimeRef.current >= intervalValue;

                if (shouldTriggerImmediate) {
                    setEffectiveInterval(IMMEDIATE_UPDATE_INTERVAL);

                    setTimeout(() => {
                        setEffectiveInterval(intervalValue);
                    }, 0);
                } else {
                    setEffectiveInterval(intervalValue);
                }

                lastHiddenTimeRef.current = null;
            } else {
                lastHiddenTimeRef.current = Date.now();
                setEffectiveInterval(DISABLED_INTERVAL);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [intervalValue]);

    return [effectiveInterval, setSettingValue];
}
