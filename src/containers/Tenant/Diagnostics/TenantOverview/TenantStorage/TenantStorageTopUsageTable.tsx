import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {ClipboardButton, Flex, HelpMark, Progress, Text} from '@gravity-ui/uikit';
import {
    ColumnTableIcon,
    ExternalTableIcon,
    TableIcon,
    TableIndexIcon,
    TopicIcon,
    ViewIcon,
} from 'ydb-ui-components';

import {CellWithPopover} from '../../../../../components/CellWithPopover/CellWithPopover';
import {LinkToSchemaObject} from '../../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {EPathType} from '../../../../../types/api/schema';
import {cn} from '../../../../../utils/cn';
import {
    EMPTY_DATA_PLACEHOLDER,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../../utils/constants';
import {formatPercent} from '../../../../../utils/dataFormatters/dataFormatters';
import {mapPathTypeToEntityName, mapPathTypeToNavigationTreeType} from '../../../utils/schema';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import i18n from '../i18n';

import {
    formatTenantStorageTableMetric,
    formatTenantStorageTableOverhead,
} from './displayFormatters';
import type {TenantStorageTopRow} from './utils';
import {isSystemStoragePath} from './utils';

import './TenantStorageTopUsageTable.scss';

const b = cn('ydb-tenant-storage-top-usage-table');

const TENANT_STORAGE_COLUMNS_WIDTH_LS_KEY = 'tenantStorageTopUsageTableColumnsWidth';

interface TenantStorageTopUsageTableProps {
    error?: unknown;
    loading: boolean;
    rows: TenantStorageTopRow[];
    withData: boolean;
}

function renderPathTypeIcon(row: TenantStorageTopRow) {
    if (isSystemStoragePath(row.path)) {
        return <TableIcon />;
    }

    switch (mapPathTypeToNavigationTreeType(row.pathType, row.pathSubType, 'directory')) {
        case 'column_table':
            return <ColumnTableIcon />;
        case 'topic':
            return <TopicIcon />;
        case 'index':
            return <TableIndexIcon />;
        case 'view':
            return <ViewIcon />;
        case 'external_table':
            return <ExternalTableIcon />;
        case 'table':
        case 'index_table':
        case 'system_table':
            return <TableIcon />;
        default:
            return null;
    }
}

function getObjectName(path: string) {
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const pathParts = normalizedPath.split('/');

    return pathParts[pathParts.length - 1] || normalizedPath;
}

function TypeCell({row}: {row: TenantStorageTopRow}) {
    let label =
        row.displayTypeLabel ??
        mapPathTypeToEntityName(row.pathType, row.pathSubType) ??
        i18n('storage.new.type-unknown');

    if (!row.displayTypeLabel && isSystemStoragePath(row.path)) {
        label = i18n('storage.new.type-system');
    } else if (!row.displayTypeLabel && row.pathType === EPathType.EPathTypeTable) {
        label = i18n('storage.new.type-row-table');
    }

    return (
        <Flex alignItems="flex-start" gap="2" className={b('type-cell')}>
            <div className={b('type-icon')}>{renderPathTypeIcon(row)}</div>
            <Text variant="body-1">{label}</Text>
        </Flex>
    );
}

function ObjectPathCell({row}: {row: TenantStorageTopRow}) {
    const pathLabel = row.displayPath ?? row.path;
    const objectName = getObjectName(pathLabel);

    return (
        <Flex direction="column" gap="0" className={b('object-cell')}>
            <CellWithPopover content={objectName} disabled={!objectName}>
                <LinkToSchemaObject path={row.path} className={b('object-link')}>
                    {objectName}
                </LinkToSchemaObject>
            </CellWithPopover>
            <CellWithPopover content={pathLabel} fullWidth>
                <div className={b('path-row')}>
                    <Text variant="caption-2" color="secondary" ellipsis className={b('path-text')}>
                        {pathLabel}
                    </Text>
                    <ClipboardButton
                        size="xs"
                        view="flat-secondary"
                        text={pathLabel}
                        className={b('path-copy')}
                    />
                </div>
            </CellWithPopover>
        </Flex>
    );
}

const SPACE_WARNING_THRESHOLD = 0.6;

function DatabaseSpaceCell({row}: {row: TenantStorageTopRow}) {
    const share = Math.min(Math.max(row.dbShare, 0), 1);
    const percent = share * 100;
    const precision = percent > 0 && percent < 1 ? 1 : 0;
    const isWarning = share >= SPACE_WARNING_THRESHOLD;

    return (
        <Flex alignItems="flex-start" gap="2" className={b('space-cell')}>
            <div className={b('space-progress')}>
                <Progress
                    value={percent}
                    size="s"
                    className={b('space-progress-bar', {warning: isWarning})}
                />
            </div>
            <Text variant="body-1" className={b('space-value')}>
                {formatPercent(share, precision) || EMPTY_DATA_PLACEHOLDER}
            </Text>
        </Flex>
    );
}

function getTopUsageColumns(): Column<TenantStorageTopRow>[] {
    return [
        {
            name: 'type',
            header: i18n('storage.new.table.type'),
            width: 130,
            align: DataTable.LEFT,
            render: ({row}) => <TypeCell row={row} />,
        },
        {
            name: 'path',
            header: i18n('storage.new.table.object-path'),
            width: undefined,
            align: DataTable.LEFT,
            render: ({row}) => <ObjectPathCell row={row} />,
        },
        {
            name: 'dbShare',
            header: i18n('storage.new.table.database-space'),
            width: 220,
            align: DataTable.LEFT,
            render: ({row}) => <DatabaseSpaceCell row={row} />,
        },
        {
            name: 'dataSize',
            header: i18n('storage.new.table.user-data'),
            width: 100,
            align: DataTable.LEFT,
            render: ({row}) => (
                <Text variant="body-1">{formatTenantStorageTableMetric(row.userData)}</Text>
            ),
        },
        {
            name: 'storageSize',
            header: i18n('storage.new.table.physical-disk'),
            width: 140,
            align: DataTable.LEFT,
            render: ({row}) => (
                <Text variant="body-1">{formatTenantStorageTableMetric(row.physicalDisk)}</Text>
            ),
        },
        {
            name: 'overhead',
            header: (
                <Flex alignItems="center" gap="1">
                    <span>{i18n('storage.new.table.overhead')}</span>
                    <HelpMark iconSize="s">{i18n('storage.new.overhead-description')}</HelpMark>
                </Flex>
            ),
            width: 106,
            align: DataTable.LEFT,
            render: ({row}) => (
                <Text variant="body-1">{formatTenantStorageTableOverhead(row.overhead)}</Text>
            ),
        },
    ];
}

export function TenantStorageTopUsageTable({
    error,
    loading,
    rows,
    withData,
}: TenantStorageTopUsageTableProps) {
    const columns = React.useMemo(() => getTopUsageColumns(), []);

    return (
        <div className={b()}>
            <TenantOverviewTableLayout
                loading={loading}
                error={error}
                withData={withData}
                title={
                    <React.Fragment>
                        <Text variant="subheader-3">
                            {i18n('storage.new.top-space-title-main')}
                        </Text>
                        <Text variant="subheader-3" color="hint">
                            {i18n('storage.new.top-space-title-suffix')}
                        </Text>
                    </React.Fragment>
                }
            >
                <ResizeableDataTable
                    columnsWidthLSKey={TENANT_STORAGE_COLUMNS_WIDTH_LS_KEY}
                    columns={columns}
                    data={rows}
                    settings={TENANT_OVERVIEW_TABLES_SETTINGS}
                />
            </TenantOverviewTableLayout>
        </div>
    );
}
