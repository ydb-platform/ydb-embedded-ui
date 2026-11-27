import type React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
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
        title: 'column_allocated-physical-resources',
        members: new Set<string>([ids.AllocatedCPU, ids.AllocatedMemory]),
    },
    {
        name: 'ydbLogicalResources',
        title: 'column_ydb-logical-resources',
        members: new Set<string>([ids.NodesCount, ids.GroupsCount]),
    },
] as const;

type DatabaseColumn = Column<DatabaseRow>;
type DatabaseColumnSetting = TableColumnSetupItem & {column: DatabaseColumn};

export function isResourceGroup(column: DatabaseColumn) {
    return resourceGroups.some(({name}) => name === column.name);
}

export function groupResourceColumns(items: DatabaseColumnSetting[]) {
    const standalone = items.filter(({id}) => !resourceGroups.some(({members}) => members.has(id)));
    const groupIndex = standalone.findIndex(({id}) => id === ids.State) + 1;
    const before = standalone.slice(0, groupIndex);
    const after = standalone.slice(groupIndex);
    const visible = (settings: DatabaseColumnSetting[]) =>
        settings.filter(({selected}) => selected).map(({column}) => column);
    const columns = visible(before);
    const orderedItems = [...before];
    for (const {name, title, members} of resourceGroups) {
        const groupItems = items.filter(({id}) => members.has(id));
        const sub = visible(groupItems);
        if (sub.length) {
            columns.push({name, header: i18n(title), align: 'center', sub});
        }
        orderedItems.push(...groupItems);
    }
    return {columns: [...columns, ...visible(after)], items: [...orderedItems, ...after]};
}

function formatMemory(bytes: number) {
    return formatStorageValuesToGb(bytes);
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
    function total(
        getValue: (row: DatabaseRow) => number | undefined,
        format: (value: number) => React.ReactNode,
    ) {
        let sum = 0;
        let count = 0;
        for (const row of rows) {
            const value = getValue(row);
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
        if (count < rows.length) {
            return (
                <Tooltip content={i18n('tooltip_partial-total', {count, total: rows.length})}>
                    <span tabIndex={0}>≥ {format(sum)}</span>
                </Tooltip>
            );
        }
        return format(sum);
    }

    const totals: DatabaseRow['totals'] = {
        [ids.Name]: i18n('label_total'),
        [ids.AllocatedCPU]: total((row) => row.allocated?.cores, formatNumber),
        [ids.AllocatedMemory]: total((row) => row.allocated?.memoryBytes, formatMemory),
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
                    quota.pool ?? (quotas.length > 1 ? i18n('label_database-quota') : undefined);
                const text = scope ? `${scope} · ${amount}` : amount;
                if (value !== undefined && quota.source === 'configured') {
                    const note =
                        field === 'used'
                            ? i18n('tooltip_quota-estimate')
                            : i18n('tooltip_configured-limit');
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
                    header={i18n('field_allocated-cpu-short')}
                    note={i18n('context_allocated-cpu')}
                />
            ),
            align: 'right',
            width: 104,
            sortAccessor: (row) => row.allocated?.cores,
            render: ({row}) => renderOptionalNumber(row.allocated?.cores, formatNumber),
        },
        {
            name: ids.AllocatedMemory,
            header: (
                <TitleWithHelpMark
                    header={i18n('field_allocated-memory-short')}
                    note={i18n('context_allocated-memory')}
                />
            ),
            align: 'right',
            width: 128,
            sortAccessor: (row) => row.allocated?.memoryBytes,
            render: ({row}) => renderOptionalNumber(row.allocated?.memoryBytes, formatMemory),
        },
    ];
}

function getStorageQuotaColumns() {
    return (['used', 'limit'] as const).map((field): DatabaseColumn => {
        const title = i18n(field === 'used' ? 'column_quota-used' : 'column_quota-limit');
        const note = i18n(field === 'used' ? 'description_quota-used' : 'description_quota-limit');
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
            case ids.GroupsCount:
                result.push({...column, header: i18n('column_storage-groups'), width: 150});
                break;
            default:
                result.push(column);
        }
    }
    if (withAllocatedResources) {
        result.push(...getAllocatedComputeColumns());
    }
    return result.map(withTotalsFooter);
}
