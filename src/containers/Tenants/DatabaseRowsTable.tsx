import React from 'react';

import type {ResizeableDataTableProps} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';

import {getTotalsRow, isResourceGroup} from './resourceColumns';
import type {DatabaseRow} from './types';

const settings = {...DEFAULT_TABLE_SETTINGS, stickyFooter: 'moving'} as const;

type Props = Omit<ResizeableDataTableProps<DatabaseRow>, 'footerData' | 'settings'>;

export function DatabaseRowsTable({columns, data, ...props}: Props) {
    const hasTotals = data.length > 0 && columns.some(isResourceGroup);
    const footerData = React.useMemo(
        () => (hasTotals ? [getTotalsRow(data)] : undefined),
        [hasTotals, data],
    );

    return (
        <ResizeableDataTable
            {...props}
            columns={columns}
            data={data}
            footerData={footerData}
            settings={settings}
        />
    );
}
