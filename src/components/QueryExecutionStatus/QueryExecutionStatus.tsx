import React from 'react';

import {CircleCheck, CircleInfo, CircleQuestionFill, CircleXmark} from '@gravity-ui/icons';
import {Icon, Tooltip} from '@gravity-ui/uikit';
import {isAxiosError} from 'axios';

import i18n from '../../containers/Tenant/Query/i18n';
import {QUERY_SETTINGS, useSetting} from '../../lib';
import {cn} from '../../utils/cn';
import {useChangedQuerySettings} from '../../utils/hooks/useChangedQuerySettings';

import './QueryExecutionStatus.scss';

const b = cn('kv-query-execution-status');

interface QueryExecutionStatusProps {
    className?: string;
    error?: unknown;
}

const QuerySettingsIndicator = () => {
    const [useQuerySettings] = useSetting<boolean>(QUERY_SETTINGS);
    const {isIndicatorShown, changedLastExecutionSettingsDescriptions} = useChangedQuerySettings();

    if (!isIndicatorShown || !useQuerySettings) {
        return null;
    }

    return (
        <Tooltip
            openDelay={0}
            content={
                <div className={b('message')}>
                    {i18n('banner.query-settings.message')}
                    {changedLastExecutionSettingsDescriptions.map((description, index, arr) => (
                        <span key={index} className={b('description-item')}>
                            {description}
                            {index < arr.length - 1 ? ', ' : null}
                        </span>
                    ))}
                </div>
            }
        >
            <Icon data={CircleInfo} className={b('query-settings-icon')} />
        </Tooltip>
    );
};

export const QueryExecutionStatus = ({className, error}: QueryExecutionStatusProps) => {
    let icon: React.ReactNode;
    let label: string;

    if (isAxiosError(error) && error.code === 'ECONNABORTED') {
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
            <QuerySettingsIndicator />
        </div>
    );
};
