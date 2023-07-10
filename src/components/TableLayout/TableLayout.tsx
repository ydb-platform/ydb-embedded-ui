import type {ReactNode} from 'react';
import block from 'bem-cn-lite';

import {TableSkeleton} from '../TableSkeleton/TableSkeleton';

import './TableLayout.scss';

const b = block('ydb-table-layout');

interface TableLayoutItemProps {
    children: ReactNode;
    className?: string;
}

interface TableProps extends TableLayoutItemProps {
    loading?: boolean;
}

export const TableLayout = ({children, className}: TableLayoutItemProps) => {
    return <div className={b(null, className)}>{children}</div>;
};

TableLayout.Controls = function TableControls({children, className}: TableLayoutItemProps) {
    return (
        <div className={b('controls-wrapper')}>
            <div className={b('controls', className)}>{children}</div>
        </div>
    );
};

TableLayout.Table = function Table({children, loading, className}: TableProps) {
    if (loading) {
        return <TableSkeleton className={b('loader')} />;
    }

    return <div className={b('table', className)}>{children}</div>;
};
