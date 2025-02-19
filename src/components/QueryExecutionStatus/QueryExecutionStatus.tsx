import React from 'react';

import {
    CircleCheckFill,
    CircleDashed,
    CircleQuestionFill,
    CircleStop,
    CircleXmark,
} from '@gravity-ui/icons';
import type {LabelProps, TextProps} from '@gravity-ui/uikit';
import {Icon, Label, Text} from '@gravity-ui/uikit';

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

    if (loading) {
        theme = 'info';
        textColor = 'info-heavy';
        icon = <Icon data={CircleDashed} />;
        label = 'Running';
    } else if (isAxiosError(error) && error.code === 'ECONNABORTED') {
        theme = 'danger';
        textColor = 'danger-heavy';
        icon = <Icon data={CircleQuestionFill} />;
        label = 'Connection aborted';
    } else if (isQueryCancelledError(error)) {
        theme = 'danger';
        textColor = 'danger-heavy';
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
