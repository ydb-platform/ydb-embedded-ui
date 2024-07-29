import React from 'react';

import {CircleCheck, CircleInfo, CircleQuestionFill, CircleXmark} from '@gravity-ui/icons';
import {Icon, Tooltip} from '@gravity-ui/uikit';
import {isAxiosError} from 'axios';

import i18n from '../../containers/Tenant/Query/i18n';
import {cn} from '../../utils/cn';
import {useChangedQuerySettingsIndicator} from '../../utils/hooks/useChangedQuerySettingsIndicator';

import './QueryExecutionStatus.scss';

const b = cn('kv-query-execution-status');

interface QueryExecutionStatusProps {
    className?: string;
    error?: unknown;
}

export const QueryExecutionStatus = ({className, error}: QueryExecutionStatusProps) => {
    let icon: React.ReactNode;
    let label: string;

    const {isIndicatorShown, changedSettingsDescription} = useChangedQuerySettingsIndicator();

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
            {isIndicatorShown ? (
                <Tooltip
                    openDelay={0}
                    content={
                        <div
                            dangerouslySetInnerHTML={{
                                __html: i18n('banner.query-settings.message', {
                                    message: changedSettingsDescription,
                                }),
                            }}
                        />
                    }
                >
                    <Icon data={CircleInfo} className={b('query-settings-icon')} />
                </Tooltip>
            ) : null}
        </div>
    );
};
