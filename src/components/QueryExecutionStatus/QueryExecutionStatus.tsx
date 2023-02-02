import type {ReactNode} from 'react';
import type {AxiosError} from 'axios';
import cn from 'bem-cn-lite';

import {Icon as UiKitIcon} from '@gravity-ui/uikit';

import Icon from '../Icon/Icon';

import questionIcon from '../../assets/icons/question.svg';

import './QueryExecutionStatus.scss';

const b = cn('kv-query-execution-status');

interface QueryExecutionStatusProps {
    className?: string;
    error?: AxiosError | Record<string, any>;
}

export const QueryExecutionStatus = ({className, error}: QueryExecutionStatusProps) => {
    let icon: ReactNode;
    let label: string;

    if (error?.code === 'ECONNABORTED') {
        icon = <UiKitIcon data={questionIcon} size={16} />;
        label = 'Connection aborted';
    } else {
        const hasError = Boolean(error);
        icon = (
            <Icon
                name={hasError ? 'failure' : 'success'}
                viewBox={hasError ? '0 0 512 512' : '0 0 16 16'}
                width={16}
                height={16}
                className={b('result-status-icon', {error: hasError})}
            />
        );
        label = hasError ? 'Failed' : 'Completed';
    }

    return (
        <div className={b(null, className)}>
            {icon}
            {label}
        </div>
    );
};
