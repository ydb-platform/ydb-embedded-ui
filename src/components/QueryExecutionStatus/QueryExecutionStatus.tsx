import {Icon as UiKitIcon} from '@gravity-ui/uikit';
import type {AxiosError} from 'axios';

import {cn} from '../../utils/cn';
import {Icon} from '../Icon';

import questionIcon from '../../assets/icons/question.svg';

import './QueryExecutionStatus.scss';

const b = cn('kv-query-execution-status');

interface QueryExecutionStatusProps {
    className?: string;
    // TODO: Remove Record<string, any> when ECONNABORTED error case is fully typed
    error?: AxiosError | Record<string, any> | string;
}

export const QueryExecutionStatus = ({className, error}: QueryExecutionStatusProps) => {
    let icon: React.ReactNode;
    let label: string;

    if (typeof error === 'object' && error?.code === 'ECONNABORTED') {
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
