import type React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import type {TableColumnSetupItem} from '@gravity-ui/uikit';
import {Tooltip} from '@gravity-ui/uikit';

import {TitleWithHelpMark} from '../../components/TitleWithHelpmark/TitleWithHelpmark';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatNumber, formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';

import {DATABASES_COLUMNS_IDS as ids} from './constants';
import {renderOptionalNumber} from './formatters';
import i18n from './i18n';
import type {DatabaseRow} from './types';

const resourceGroups = [
    {
        name: 'allocatedPhysicalResources',
        title: 'field_allocated-physical-resources',
        members: new Set<string>([ids.AllocatedCPU, ids.AllocatedMemory]),
    },
    {
        name: 'ydbLogicalResources',
        title: 'field_ydb-logical-resources',
        members: new Set<string>([ids.NodesCount, ids.GroupsCount]),
    },
] as const;

type DatabaseColumn = Column<DatabaseRow>;
type DatabaseColumnSetting = TableColumnSetupItem & {column: DatabaseColumn};

export function isResourceGroup(column: DatabaseColumn) {
    return resourceGroups.some(({name}) => name === column.name);
}

/**
 * Columns of a group are set up together: the settings list has one item per group,
 * so a group is moved, shown and hidden as a whole.
 */
export function groupResourceColumns(items: DatabaseColumnSetting[]) {
    const columns: DatabaseColumn[] = [];
    const setupItems: TableColumnSetupItem[] = [];
    const placedGroups = new Set<string>();
    for (const item of items) {
        const group = resourceGroups.find(({members}) => members.has(item.id));
        if (!group) {
            setupItems.push(item);
            if (item.selected) {
                columns.push(item.column);
            }
        } else if (!placedGroups.has(group.name)) {
            // The group stands where its first column does.
            placedGroups.add(group.name);
            const sub = items
                .filter(({id, selected}) => selected && group.members.has(id))
                .map(({column}) => column);
            const title = i18n(group.title);
            setupItems.push({id: group.name, title, selected: sub.length > 0});
            if (sub.length) {
                columns.push({name: group.name, header: title, align: 'center', sub});
            }
        }
    }
    return {columns, items: setupItems};
}

/** Turns updated settings of column groups back into the settings of their columns. */
export function ungroupResourceColumns(
    updated: TableColumnSetupItem[],
    items: DatabaseColumnSetting[],
): TableColumnSetupItem[] {
    return updated.flatMap((item) => {
        const group = resourceGroups.find(({name}) => name === item.id);
        if (!group) {
            return [item];
        }
        return items
            .filter(({id}) => group.members.has(id))
            .map((member) => ({...member, selected: item.selected}));
    });
}

const TOTALS_ROW: PreparedTenant = {
    sharedTenantName: undefined,
    sharedNodeIds: undefined,
    controlPlaneName: '',
    cpu: undefined,
    memory: undefined,
    storage: undefined,
    nodesCount: 0,
    groupsCount: 0,
};

/** The footer row of a databases table: sums over the given rows by column name. */
export function getTotalsRow(rows: readonly DatabaseRow[]): DatabaseRow {
    /** `null` is a row the column does not apply to, `undefined` is a row with an unknown value. */
    function total(
        getValue: (row: DatabaseRow) => number | null | undefined,
        format: (value: number) => React.ReactNode,
    ) {
        let sum = 0;
        let count = 0;
        let applicable = 0;
        for (const row of rows) {
            const value = getValue(row);
            if (value === null) {
                continue;
            }
            applicable++;
            if (value !== undefined) {
                sum += value;
                count++;
            }
        }
        if (!count) {
            return EMPTY_DATA_PLACEHOLDER;
        }
        if (count < applicable) {
            return (
                <Tooltip content={i18n('context_partial-total', {count, total: applicable})}>
                    <span tabIndex={0}>≥ {format(sum)}</span>
                </Tooltip>
            );
        }
        return format(sum);
    }

    const totals = {
        [ids.Name]: i18n('field_total'),
        [ids.AllocatedCPU]: total((row) => row.allocated && row.allocated.cores, formatNumber),
        [ids.AllocatedMemory]: total(
            (row) => row.allocated && row.allocated.memoryBytes,
            formatStorageValuesToGb,
        ),
        [ids.NodesCount]: total((row) => row.NodeIds?.length, formatNumber),
        [ids.GroupsCount]: total(
            (row) => parseOptionalNonNegativeNumber(row.StorageGroups),
            formatNumber,
        ),
    };
    return {...TOTALS_ROW, totals};
}

function getAllocatedComputeColumns(): DatabaseColumn[] {
    return [
        {
            name: ids.AllocatedCPU,
            header: (
                <TitleWithHelpMark
                    header={i18n('field_allocated-cpu')}
                    note={i18n('context_allocated-cpu')}
                />
            ),
            align: 'right',
            width: 104,
            defaultOrder: DataTable.DESCENDING,
            sortAccessor: (row) => row.allocated?.cores,
            render: ({row}) => renderOptionalNumber(row.allocated?.cores, formatNumber),
        },
        {
            name: ids.AllocatedMemory,
            header: (
                <TitleWithHelpMark
                    header={i18n('field_allocated-memory')}
                    note={i18n('context_allocated-memory')}
                />
            ),
            align: 'right',
            width: 128,
            defaultOrder: DataTable.DESCENDING,
            sortAccessor: (row) => row.allocated?.memoryBytes,
            render: ({row}) =>
                renderOptionalNumber(row.allocated?.memoryBytes, formatStorageValuesToGb),
        },
    ];
}

/** Renders the footer cell from the totals row instead of the column's own cell. */
function withTotalsFooter(column: DatabaseColumn): DatabaseColumn {
    const {render} = column;
    if (!render) {
        return column;
    }
    return {
        ...column,
        render: (cell) => (cell.footer ? cell.row.totals?.[column.name] : render(cell)),
    };
}

/** Turns the columns of the cluster databases table into the columns of My databases. */
export function getMyDatabasesColumns(
    columns: DatabaseColumn[],
    {withAllocatedResources}: {withAllocatedResources: boolean},
) {
    const result: DatabaseColumn[] = [];
    const logicalResources: DatabaseColumn[] = [];
    for (const column of columns) {
        switch (column.name) {
            case ids.Type:
                result.push({...column, render: ({row}) => row.Type});
                break;
            case ids.Storage:
                break;
            case ids.NodesCount:
                logicalResources.push(column);
                break;
            case ids.GroupsCount:
                logicalResources.push({
                    ...column,
                    header: i18n('field_storage-groups'),
                    width: 150,
                });
                break;
            default:
                result.push(column);
        }
    }
    // Until the user moves them, column groups stand right after the state.
    result.splice(
        result.findIndex(({name}) => name === ids.State) + 1,
        0,
        ...(withAllocatedResources ? getAllocatedComputeColumns() : []),
        ...logicalResources,
    );
    return result.map(withTotalsFooter);
}
