import {type ReactNode} from 'react';
import {cn} from '../../utils/cn';
import {Loader} from '../Loader';

import './LoadingContainer.scss';

const block = cn('ydb-loading-container');

interface LoadingContainerProps {
    loader?: ReactNode;
    children?: ReactNode;
    loading?: boolean;
    className?: string;
}

// Use visibility:hidden to preserve loading content size
// Also it helps to properly render charts and virtualized elements
// that didn't render properly with display:none since they need parent container sizes
export const LoadingContainer = ({
    loader = <Loader className={block('loader')} />,
    children,
    loading,
    className,
}: LoadingContainerProps) => {
    return (
        <div className={block(null, className)}>
            {loading && loader}
            <div style={{visibility: loading ? 'hidden' : undefined}}>{children}</div>
        </div>
    );
};
