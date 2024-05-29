import {CircleCheck, CircleQuestionFill, CircleXmark} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';
import type {AxiosError} from 'axios';

import {cn} from '../../utils/cn';

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
        </div>
    );
};
