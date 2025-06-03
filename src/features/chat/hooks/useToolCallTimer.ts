import React from 'react';

export const useToolCallTimer = (startTime?: number, endTime?: number) => {
    const [currentTime, setCurrentTime] = React.useState(Date.now());

    React.useEffect(() => {
        if (!startTime || endTime) {
            return;
        }

        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, endTime]);

    const formatDuration = (start?: number, end?: number) => {
        if (!start) {
            return '[00:00]';
        }

        const endTimestamp = end || currentTime;
        const duration = Math.floor((endTimestamp - start) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`;
    };

    return formatDuration(startTime, endTime);
};
