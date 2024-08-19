import React from 'react';

import {duration} from '@gravity-ui/date-utils';
import {Label} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {HOUR_IN_SECONDS, SECOND_IN_MS} from '../../utils/constants';

const b = cn('ydb-query-elapsed-time');

interface ElapsedTimeProps {
    className?: string;
}

export default function ElapsedTime({className}: ElapsedTimeProps) {
    const [, reRender] = React.useState({});
    const [startTime] = React.useState(Date.now());
    const elapsedTime = Date.now() - startTime;

    React.useEffect(() => {
        const timerId = setInterval(() => {
            reRender({});
        }, SECOND_IN_MS);
        return () => {
            clearInterval(timerId);
        };
    }, []);

    const elapsedTimeFormatted =
        elapsedTime > HOUR_IN_SECONDS * SECOND_IN_MS
            ? duration(elapsedTime).format('hh:mm:ss')
            : duration(elapsedTime).format('mm:ss');

    return <Label className={b(null, className)}>{elapsedTimeFormatted}</Label>;
}
