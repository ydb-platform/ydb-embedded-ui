import React from 'react';

import {
    CircleCheck,
    CircleInfo,
    CircleQuestionFill,
    CircleStop,
    CircleXmark,
} from '@gravity-ui/icons';
import {Icon, Spin, Tooltip} from '@gravity-ui/uikit';

import i18n from '../../containers/Tenant/Query/i18n';
import {isQueryCancelledError} from '../../containers/Tenant/Query/utils/isQueryCancelledError';
import {cn} from '../../utils/cn';
import {useChangedQuerySettings} from '../../utils/hooks/useChangedQuerySettings';
import {isAxiosError} from '../../utils/response';
import QuerySettingsDescription from '../QuerySettingsDescription/QuerySettingsDescription';

import './QueryExecutionStatus.scss';

const b = cn('kv-query-execution-status');

interface QueryExecutionStatusProps {
    className?: string;
    error?: unknown;
    loading?: boolean;
}

const QuerySettingsIndicator = () => {
    const {isIndicatorShown, changedLastExecutionSettingsDescriptions} = useChangedQuerySettings();

    if (!isIndicatorShown) {
        return null;
    }

    return (
        <Tooltip
            openDelay={0}
            content={
                <QuerySettingsDescription
                    prefix={i18n('banner.query-settings.message')}
                    querySettings={changedLastExecutionSettingsDescriptions}
                />
            }
        >
            <Icon data={CircleInfo} className={b('query-settings-icon')} />
        </Tooltip>
    );
};

export const QueryExecutionStatus = ({className, error, loading}: QueryExecutionStatusProps) => {
    let icon: React.ReactNode;
    let label: string;

    if (loading) {
        icon = <Spin size="xs" />;
        label = 'Running';
    } else if (isAxiosError(error) && error.code === 'ECONNABORTED') {
        icon = <Icon data={CircleQuestionFill} />;
        label = 'Connection aborted';
    } else if (isQueryCancelledError(error)) {
        icon = <Icon data={CircleStop} />;
        label = 'Stopped';
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
            {isQueryCancelledError(error) || loading ? null : <QuerySettingsIndicator />}
        </div>
    );
};
