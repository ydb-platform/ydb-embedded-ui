import type {BaseTableProps} from '@gravity-ui/table';
import {BaseTable} from '@gravity-ui/table';

import {cn} from '../../utils/cn';

import './Table.scss';

const block = cn('ydb-table');

interface TableProps<TData> extends BaseTableProps<TData> {
    width?: 'max' | 'auto';
}

interface ColumnHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function ColumnHeader({children, className}: ColumnHeaderProps) {
    return <div className={block('table-header-content', className)}>{children}</div>;
}

export function Table<TData>({className, width, ...props}: TableProps<TData>) {
    return (
        <div className={block()}>
            <BaseTable
                headerCellClassName={({column}) => {
                    const align = column.columnDef.meta?.align;
                    return block('table-header-cell', {align});
                }}
                cellClassName={(cell) => {
                    const align = cell?.column.columnDef.meta?.align;
                    const verticalAlign = cell?.column.columnDef.meta?.verticalAlign;
                    return block('table-cell', {align, 'vertical-align': verticalAlign});
                }}
                className={block('table', {width}, className)}
                {...props}
            />
        </div>
    );
}
