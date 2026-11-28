import type React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import type {TableColumnSetupItem} from '@gravity-ui/uikit';
import {Flex, Tooltip} from '@gravity-ui/uikit';

import {TitleWithHelpMark} from '../../components/TitleWithHelpmark/TitleWithHelpmark';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {formatBytes} from '../../utils/bytesParsers';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatNumber, formatStorageValuesToGb} from '../../utils/dataFormatters/dataFormatters';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';

import {SHOW_MY_DATABASES_STORAGE_COLUMNS, DATABASES_COLUMNS_IDS as ids} from './constants';
import {renderOptionalNumber} from './formatters';
import i18n from './i18n';
import type {StorageQuota} from './resourceUsage';
import {databaseStorageQuotas} from './resourceUsage';
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

function formatStorageSize(value: number) {
    return formatBytes({value, fixedDecimalPlaces: value < 1000 ? 0 : 2});
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

function totalQuotaLimit(row: PreparedTenant) {
    const quotas = databaseStorageQuotas(row);
    // An overall quota and per-pool limits can cover the same bytes.
    const overall = quotas.find((quota) => !quota.pool);
    const limits = (overall ? [overall] : quotas).map(({limit}) => limit);
    if (limits.includes(0)) {
        return Infinity;
    }
    if (!limits.length || !limits.every((limit): limit is number => limit !== undefined)) {
        return undefined;
    }
    return limits.reduce((sum, limit) => sum + limit, 0);
}

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
        if (sum === Infinity) {
            return i18n('value_no-limit');
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

    const totals: DatabaseRow['totals'] = {
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
    if (SHOW_MY_DATABASES_STORAGE_COLUMNS) {
        totals[ids.StorageQuotaLimit] = total(totalQuotaLimit, formatStorageSize);
    }
    return {...TOTALS_ROW, totals};
}

function renderQuotaCell(quotas: StorageQuota[], field: 'used' | 'limit') {
    if (!quotas.length) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    return (
        <Flex direction="column" alignItems="flex-end">
            {quotas.map((quota) => {
                const value = quota[field];
                const amount =
                    field === 'limit' && value === 0
                        ? i18n('value_no-limit')
                        : renderOptionalNumber(value, formatStorageSize);
                const scope =
                    quota.pool ?? (quotas.length > 1 ? i18n('field_database-quota') : undefined);
                const text = scope ? `${scope} · ${amount}` : amount;
                if (value !== undefined && quota.source === 'configured') {
                    const note =
                        field === 'used'
                            ? i18n('context_quota-estimate')
                            : i18n('context_configured-limit');
                    return (
                        <Tooltip key={quota.pool ?? ''} content={note}>
                            <span tabIndex={0}>{text}</span>
                        </Tooltip>
                    );
                }
                return <span key={quota.pool ?? ''}>{text}</span>;
            })}
        </Flex>
    );
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

function getStorageQuotaColumns() {
    return (['used', 'limit'] as const).map((field): DatabaseColumn => {
        const title = i18n(field === 'used' ? 'field_quota-used' : 'field_quota-limit');
        const note = i18n(field === 'used' ? 'context_quota-used' : 'context_quota-limit');
        return {
            name: field === 'used' ? ids.StorageQuotaUsed : ids.StorageQuotaLimit,
            header: <TitleWithHelpMark header={title} note={note} />,
            align: 'right',
            width: 215,
            sortAccessor: (row) => {
                const values = databaseStorageQuotas(row)
                    .map((quota) => quota[field])
                    .filter((value): value is number => value !== undefined);
                return values.length ? Math.max(...values) : undefined;
            },
            render: ({row}) => renderQuotaCell(databaseStorageQuotas(row), field),
        };
    });
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
            case ids.Memory:
                result.push(column);
                if (SHOW_MY_DATABASES_STORAGE_COLUMNS) {
                    result.push(...getStorageQuotaColumns());
                }
                break;
            case ids.Storage:
                if (SHOW_MY_DATABASES_STORAGE_COLUMNS) {
                    result.push(column);
                }
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
