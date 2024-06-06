import {CircleCheck, CircleQuestionFill, CircleXmark} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';
import {isAxiosError} from 'axios';

import {cn} from '../../utils/cn';

import './QueryExecutionStatus.scss';

const b = cn('kv-query-execution-status');

interface QueryExecutionStatusProps {
    className?: string;
    error?: unknown;
}

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
        </div>
    );
};
