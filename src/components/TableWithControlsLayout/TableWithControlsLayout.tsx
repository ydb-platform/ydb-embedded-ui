import {cn} from '../../utils/cn';
import {TableSkeleton} from '../TableSkeleton/TableSkeleton';

import './TableWithControlsLayout.scss';

const b = cn('ydb-table-with-controls-layout');

interface TableWithControlsLayoutItemProps {
    children: React.ReactNode;
    className?: string;
}

interface TableProps extends TableWithControlsLayoutItemProps {
    loading?: boolean;
}

export const TableWithControlsLayout = ({
    children,
    className,
}: TableWithControlsLayoutItemProps) => {
    return <div className={b(null, className)}>{children}</div>;
};

TableWithControlsLayout.Controls = function TableControls({
    children,
    className,
}: TableWithControlsLayoutItemProps) {
    return (
        <div className={b('controls-wrapper')}>
            <div className={b('controls', className)}>{children}</div>
        </div>
    );
};

TableWithControlsLayout.Table = function Table({children, loading, className}: TableProps) {
    if (loading) {
        return <TableSkeleton className={b('loader')} />;
    }

    return <div className={b('table', className)}>{children}</div>;
};
