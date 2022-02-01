import cn from 'bem-cn-lite';

import Icon from '../Icon/Icon';

import './QueryExecutionStatus.scss';

const b = cn('kv-query-execution-status');

interface QueryExecutionStatusProps {
    className?: string;
    hasError?: boolean;
}

function QueryExecutionStatus({className, hasError}: QueryExecutionStatusProps) {
    return hasError === undefined ? null : (
        <div className={b(null, className)}>
            <Icon
                name={hasError ? 'failure' : 'success'}
                viewBox={hasError ? '0 0 512 512' : '0 0 16 16'}
                width={16}
                height={16}
                className={b('result-status-icon', {error: hasError})}
            />
            {hasError ? 'Failed' : 'Completed'}
        </div>
    );
}

export default QueryExecutionStatus;
