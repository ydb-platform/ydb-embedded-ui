import React from 'react';

import {CircleCheckFill, CircleQuestionFill, CircleStop, CircleXmark} from '@gravity-ui/icons';
import type {LabelProps, TextProps} from '@gravity-ui/uikit';
import {Icon, Label, Spin, Text} from '@gravity-ui/uikit';

import {isQueryCancelledError} from '../../containers/Tenant/Query/utils/isQueryCancelledError';
import {cn} from '../../utils/cn';
import {isAxiosError} from '../../utils/response';

import {useElapsedTime} from './useElapsedTime';

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

    const elapsedTime = useElapsedTime(loading);
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
            value={elapsedTime}
        >
            <Text color={textColor}>{label}</Text>
        </Label>
    );
};
