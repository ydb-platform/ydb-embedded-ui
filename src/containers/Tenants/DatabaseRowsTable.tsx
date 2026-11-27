import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';

import type {ResizeableDataTableProps} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';

import {getAllocatedResourceFooter, isResourceGroup} from './resourceColumns';
import type {AllocatedResources} from './resourceUsage';

const settings = {...DEFAULT_TABLE_SETTINGS, stickyFooter: 'moving'} as const;

interface Props extends Omit<ResizeableDataTableProps<PreparedTenant>, 'footerData' | 'settings'> {
    allocations: ReadonlyMap<PreparedTenant, AllocatedResources | undefined>;
}

export function DatabaseRowsTable({allocations, columns, data, ...props}: Props) {
    const layout = React.useMemo(() => {
        if (!data.length || !columns.some(isResourceGroup)) {
            return {columns};
        }
        const cells = getAllocatedResourceFooter(data, allocations);
        const withFooter = (column: Column<PreparedTenant>): Column<PreparedTenant> => {
            if (column.sub) {
                return {...column, sub: column.sub.map(withFooter)};
            }
            return {
                ...column,
                render: (cell) => (cell.footer ? cells.get(column.name) : column.render?.(cell)),
            };
        };
        // DataTable requires one data item per footer row. Footer cells use only the totals above.
        return {columns: columns.map(withFooter), footerData: data.slice(0, 1)};
    }, [allocations, columns, data]);

    return <ResizeableDataTable {...props} {...layout} settings={settings} data={data} />;
}
