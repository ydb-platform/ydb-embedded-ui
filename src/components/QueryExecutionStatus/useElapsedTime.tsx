import React from 'react';

import {duration} from '@gravity-ui/date-utils';

import {HOUR_IN_SECONDS, SECOND_IN_MS} from '../../utils/constants';

export function useElapsedTime(loading?: boolean) {
    const [startTime, setStartTime] = React.useState(Date.now());
    const [elapsedTime, setElapsedTime] = React.useState(0);

    React.useEffect(() => {
        let timerId: ReturnType<typeof setInterval> | undefined;

        if (loading) {
            setElapsedTime(0);
            setStartTime(Date.now());
            timerId = setInterval(() => {
                setElapsedTime(Date.now() - startTime);
            }, SECOND_IN_MS);
        } else {
            clearInterval(timerId);
        }
        return () => {
            clearInterval(timerId);
        };
    }, [loading, startTime]);

    return elapsedTime > HOUR_IN_SECONDS * SECOND_IN_MS
        ? duration(elapsedTime).format('hh:mm:ss')
        : duration(elapsedTime).format('mm:ss');
}
