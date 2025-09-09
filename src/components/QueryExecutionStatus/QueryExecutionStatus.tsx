import React from 'react';

import {duration} from '@gravity-ui/date-utils';
import {CircleCheckFill, CircleQuestionFill, CircleStop, CircleXmark} from '@gravity-ui/icons';
import type {LabelProps, TextProps} from '@gravity-ui/uikit';
import {Icon, Label, Spin, Text} from '@gravity-ui/uikit';

import {isQueryCancelledError} from '../../containers/Tenant/Query/utils/isQueryCancelledError';
import {selectQueryDuration} from '../../store/reducers/query/query';
import {cn} from '../../utils/cn';
import {HOUR_IN_SECONDS, SECOND_IN_MS} from '../../utils/constants';
import {useTypedSelector} from '../../utils/hooks';
import {isAxiosError} from '../../utils/response';

import {useElapsedDuration} from './useElapsedDuration';

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
    let theme: LabelProps['theme'];
    let textColor: TextProps['color'];
    const {startTime, endTime} = useTypedSelector(selectQueryDuration);

    const durationMs = useElapsedDuration({startTime, endTime, loading});
    const formattedDuration = React.useMemo(() => {
        if (durationMs < 10 * SECOND_IN_MS) {
            return duration(durationMs).format('mm:ss.SSS');
        }
        return durationMs > HOUR_IN_SECONDS * SECOND_IN_MS
            ? duration(durationMs).format('hh:mm:ss')
            : duration(durationMs).format('mm:ss');
    }, [durationMs]);

    const isCancelled = isQueryCancelledError(error);

    if (loading) {
        theme = 'info';
        textColor = 'info-heavy';
        icon = <Spin size="xs" />;
        label = 'Running';
    } else if (isAxiosError(error) && error.code === 'ECONNABORTED') {
        theme = 'danger';
        textColor = 'danger-heavy';
        icon = <Icon data={CircleQuestionFill} />;
        label = 'Connection aborted';
    } else if (isCancelled) {
        theme = 'warning';
        textColor = 'warning-heavy';
        icon = <Icon data={CircleStop} className={b('result-status-icon', {error: true})} />;
        label = 'Stopped';
    } else {
        const hasError = Boolean(error);
        theme = hasError ? 'danger' : 'success';
        textColor = hasError ? 'danger-heavy' : 'positive-heavy';
        icon = (
            <Icon
                data={hasError ? CircleXmark : CircleCheckFill}
                className={b('result-status-icon', {error: hasError})}
            />
        );
        label = hasError ? 'Failed' : 'Completed';
    }

    return (
        <Label
            theme={theme}
            size="m"
            className={b(null, className)}
            icon={icon}
            value={formattedDuration}
        >
            <Text color={textColor}>{label}</Text>
        </Label>
    );
};
