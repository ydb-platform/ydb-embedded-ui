import React from 'react';

import {CircleCheck, CircleQuestionFill, CircleXmark} from '@gravity-ui/icons';
import {Icon, Label, Spin} from '@gravity-ui/uikit';
import {isAxiosError} from 'axios';

import {MS_IN_SECOND} from '../../lib';
import {cn} from '../../utils/cn';
import {configuredNumeral} from '../../utils/numeral';

import './QueryExecutionStatus.scss';

const b = cn('kv-query-execution-status');

interface QueryExecutionStatusProps {
    className?: string;
    error?: unknown;
    loading?: boolean;
}

export const QueryExecutionStatus = ({className, error, loading}: QueryExecutionStatusProps) => {
    let icon: React.ReactNode;
    let label: string;

    const [startTime, setStartTime] = React.useState<number>(0);
    const [elapsedTime, setElapsedTime] = React.useState<number>(0);

    const intervalRef = React.useRef<number>();

    React.useEffect(() => {
        if (loading) {
            setStartTime(Date.now());
        } else {
            clearInterval(intervalRef.current);
            setElapsedTime(0);
        }
    }, [loading]);

    React.useEffect(() => {
        intervalRef.current = window.setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / MS_IN_SECOND));
        }, MS_IN_SECOND);

        return () => window.clearInterval(intervalRef.current);
    }, [startTime]);

    if (loading) {
        icon = <Spin size="xs" />;
        label = 'Running';
    } else if (isAxiosError(error) && error.code === 'ECONNABORTED') {
        icon = <Icon data={CircleQuestionFill} />;
        label = 'Connection aborted';
    } else {
        const hasError = Boolean(error);
        icon = (
            <Icon
                data={hasError ? CircleXmark : CircleCheck}
                className={b('result-status-icon', {error: hasError})}
            />
        );
        label = hasError ? 'Failed' : 'Completed';
    }

    return (
        <div className={b(null, className)}>
            {icon}
            {label}
            {loading ? (
                <Label className={b('elapsed-label')}>
                    {configuredNumeral(elapsedTime).format('00:00')}
                </Label>
            ) : null}
        </div>
    );
};
