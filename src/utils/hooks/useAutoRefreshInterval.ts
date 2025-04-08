import React from 'react';

import {AUTO_REFRESH_INTERVAL} from '../constants';

import {useSetting} from './useSetting';

export function useAutoRefreshInterval(): [number, (value: number) => void] {
    const [settingValue, setSettingValue] = useSetting(AUTO_REFRESH_INTERVAL, 0);
    const [effectiveInterval, setEffectiveInterval] = React.useState(
        document.visibilityState === 'visible' ? settingValue : 0,
    );

    React.useEffect(() => {
        // Update the effective interval when the setting changes
        setEffectiveInterval(document.visibilityState === 'visible' ? settingValue : 0);

        // Handle visibility change events
        const handleVisibilityChange = () => {
            setEffectiveInterval(document.visibilityState === 'visible' ? settingValue : 0);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [settingValue]);

    return [effectiveInterval, setSettingValue];
}
