import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {Flex, HelpMark, Progress, Text} from '@gravity-ui/uikit';
import {
    ColumnTableIcon,
    ExternalTableIcon,
    TableIcon,
    TableIndexIcon,
    TopicIcon,
    ViewIcon,
} from 'ydb-ui-components';

import {CellWithPopover} from '../../../../../components/CellWithPopover/CellWithPopover';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {LinkToSchemaObject} from '../../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {LoaderWrapper} from '../../../../../components/LoaderWrapper/LoaderWrapper';
import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {EPathType} from '../../../../../types/api/schema';
import {EType} from '../../../../../types/api/tenant';
import {cn} from '../../../../../utils/cn';
import {
    EMPTY_DATA_PLACEHOLDER,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../../utils/constants';
import {formatNumber, formatPercent} from '../../../../../utils/dataFormatters/dataFormatters';
import {
    formatMetricBytes,
    formatMetricPercent,
    getConsistentMetricBytesSize,
} from '../../../../../utils/storageMetrics';
import {mapPathTypeToEntityName, mapPathTypeToNavigationTreeType} from '../../../utils/schema';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import i18n from '../i18n';

import type {TenantStorageProps} from './types';
import {useTenantStorageNewData} from './useTenantStorageNewData';
import type {TenantStorageMediaSection, TenantStorageSummary, TenantStorageTopRow} from './utils';
import {buildTenantStorageMediaSections, isSystemStoragePath} from './utils';

import './TenantStorageNew.scss';

const b = cn('ydb-tenant-storage-new');

const TENANT_STORAGE_COLUMNS_WIDTH_LS_KEY = 'tenantStorageTopUsageTableColumnsWidth';

interface SummaryMetricProps {
    label: string;
    note?: string;
    value: string;
    emphasize?: boolean;
}

interface SummaryCardProps {
    title: string;
    description: string;
    summary: TenantStorageSummary;
    metrics: SummaryMetricProps[];
    showHelpOnDescription?: boolean;
    displayNoLimit?: 'empty' | 'filled';
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

function formatSummaryPercent(value: number) {
    return value > 0 ? i18n('storage.new.used-percent', {value: formatMetricPercent(value)}) : '';
}

function formatOverheadValue(value?: number) {
    if (value === undefined || !Number.isFinite(value) || value <= 0) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const precision = value >= 10 || Number.isInteger(value) ? 0 : 1;
    const normalizedValue = Number(value.toFixed(precision));

    return `${formatNumber(normalizedValue)}x`;
}

function getMediaSectionLabel(mediaType?: EType) {
    if (!mediaType || mediaType === EType.None) {
        return undefined;
    }

    return mediaType;
}

function SummaryMetric({label, note, value, emphasize}: SummaryMetricProps) {
    return (
        <div className={b('summary-metric', {emphasize})}>
            <Text variant="subheader-2">{value}</Text>
            <Flex alignItems="center" gap="1" className={b('summary-metric-label')}>
                <Text color="secondary">{label}</Text>
                {note ? <HelpMark iconSize="s">{note}</HelpMark> : null}
            </Flex>
        </div>
    );
}

function SummaryCard({
    title,
    description,
    summary,
    metrics,
    showHelpOnDescription = false,
    displayNoLimit,
}: SummaryCardProps) {
    const total = summary.quota ?? summary.total;
    let percent = 0;

    if (total) {
        percent = summary.usedPercent;
    } else if (displayNoLimit === 'filled') {
        percent = 100;
    }

    return (
        <div className={b('summary-card')}>
            <Flex justifyContent="space-between" alignItems="flex-start" gap="4">
                <div className={b('summary-copy')}>
                    <Text variant="subheader-3">{title}</Text>
                    <Flex alignItems="center" gap="1">
                        <Text color="secondary">{description}</Text>
                        {showHelpOnDescription ? (
                            <HelpMark iconSize="s">{description}</HelpMark>
                        ) : null}
                    </Flex>
                </div>
                <div className={b('summary-metrics')}>
                    {metrics.map((metric) => (
                        <SummaryMetric key={metric.label} {...metric} />
                    ))}
                </div>
            </Flex>
            <div className={b('summary-progress')}>
                <Progress
                    value={percent}
                    size="s"
                    className={b('summary-progress-bar')}
                    text={undefined}
                    theme="success"
                />
            </div>
            <Flex justifyContent="space-between" alignItems="center" gap="4">
                <div />
                <Text color="secondary" className={b('summary-used')}>
                    {!total && displayNoLimit === 'filled'
                        ? i18n('storage.new.quota-unlimited')
                        : formatSummaryPercent(summary.usedPercent)}
                </Text>
            </Flex>
        </div>
    );
}

function TypeCell({row}: {row: TenantStorageTopRow}) {
    const defaultLabel =
        mapPathTypeToEntityName(row.pathType, row.pathSubType) ?? i18n('storage.new.type-unknown');
    let label = defaultLabel;

    if (isSystemStoragePath(row.path)) {
        label = i18n('storage.new.type-system');
    } else if (row.pathType === EPathType.EPathTypeTable) {
        label = i18n('storage.new.type-row-table');
    }

    return (
        <Flex alignItems="center" gap="2" className={b('type-cell')}>
            <div className={b('type-icon')}>{renderPathTypeIcon(row)}</div>
            <Text>{label}</Text>
        </Flex>
    );
}

function ObjectPathCell({row}: {row: TenantStorageTopRow}) {
    const objectName = getObjectName(row.path);

    return (
        <Flex direction="column" gap="1" className={b('object-cell')}>
            <CellWithPopover content={objectName} disabled={!objectName}>
                <LinkToSchemaObject path={row.path} className={b('object-link')}>
                    {objectName}
                </LinkToSchemaObject>
            </CellWithPopover>
            <CellWithPopover content={row.path}>
                <Text color="secondary" ellipsis>
                    {row.path}
                </Text>
            </CellWithPopover>
        </Flex>
    );
}

function DatabaseSpaceCell({row}: {row: TenantStorageTopRow}) {
    const percent = Math.min(row.dbShare * 100, 100);
    const precision = percent > 0 && percent < 1 ? 1 : 0;

    return (
        <Flex alignItems="center" gap="2" className={b('space-cell')}>
            <div className={b('space-progress')}>
                <Progress value={percent} size="s" className={b('space-progress-bar')} />
            </div>
            <Text className={b('space-value')}>
                {formatPercent(row.dbShare, precision) || EMPTY_DATA_PLACEHOLDER}
            </Text>
        </Flex>
    );
}

function getTopUsageColumns(): Column<TenantStorageTopRow>[] {
    return [
        {
            name: 'type',
            header: i18n('storage.new.table.type'),
            width: 180,
            align: DataTable.LEFT,
            render: ({row}) => <TypeCell row={row} />,
        },
        {
            name: 'path',
            header: i18n('storage.new.table.object-path'),
            width: 320,
            align: DataTable.LEFT,
            render: ({row}) => <ObjectPathCell row={row} />,
        },
        {
            name: 'dbShare',
            header: i18n('storage.new.table.database-space'),
            width: 200,
            align: DataTable.LEFT,
            render: ({row}) => <DatabaseSpaceCell row={row} />,
        },
        {
            name: 'dataSize',
            header: i18n('storage.new.table.user-data'),
            width: 120,
            align: DataTable.LEFT,
            render: ({row}) => formatMetricBytes(row.userData, 'gb'),
        },
        {
            name: 'storageSize',
            header: i18n('storage.new.table.physical-disk'),
            width: 140,
            align: DataTable.LEFT,
            render: ({row}) => formatMetricBytes(row.physicalDisk, 'gb'),
        },
        {
            name: 'overhead',
            header: (
                <Flex alignItems="center" gap="1">
                    <span>{i18n('storage.new.table.overhead')}</span>
                    <HelpMark iconSize="s">{i18n('storage.new.overhead-description')}</HelpMark>
                </Flex>
            ),
            width: 110,
            align: DataTable.LEFT,
            render: ({row}) => formatOverheadValue(row.overhead),
        },
    ];
}

function renderUserSummary(summary: TenantStorageSummary) {
    const metricsSize = getConsistentMetricBytesSize([
        summary.available,
        summary.used,
        summary.quota,
    ]);

    return (
        <SummaryCard
            title={i18n('storage.new.user-data-title')}
            description={i18n('storage.new.user-data-description')}
            summary={summary}
            showHelpOnDescription
            metrics={[
                {
                    label: i18n('storage.new.available'),
                    value: formatMetricBytes(summary.available, metricsSize),
                },
                {
                    label: i18n('storage.new.used'),
                    value: formatMetricBytes(summary.used, metricsSize),
                },
                {
                    label: i18n('storage.new.quota'),
                    note:
                        summary.quota === undefined
                            ? i18n('storage.new.quota-missing-description')
                            : undefined,
                    value: formatMetricBytes(summary.quota, metricsSize),
                },
            ]}
        />
    );
}

function renderPhysicalSummary(summary: TenantStorageSummary) {
    const metricsSize = getConsistentMetricBytesSize([
        summary.available,
        summary.used,
        summary.total,
    ]);

    return (
        <SummaryCard
            title={i18n('storage.new.physical-title')}
            description={i18n('storage.new.physical-description')}
            summary={summary}
            metrics={[
                {
                    emphasize: true,
                    label: i18n('storage.new.overhead'),
                    note: i18n('storage.new.overhead-description'),
                    value: formatOverheadValue(summary.overhead),
                },
                {
                    label: i18n('storage.new.available'),
                    value: formatMetricBytes(summary.available, metricsSize),
                },
                {
                    label: i18n('storage.new.used'),
                    value: formatMetricBytes(summary.used, metricsSize),
                },
                {
                    label: i18n('storage.new.total'),
                    value: formatMetricBytes(summary.total, metricsSize),
                },
            ]}
            displayNoLimit="filled"
        />
    );
}

function MediaSection({
    section,
    showMediaTypeLabel,
}: {
    section: TenantStorageMediaSection;
    showMediaTypeLabel: boolean;
}) {
    const mediaLabel = getMediaSectionLabel(section.mediaType);

    return (
        <Flex direction="column" gap={3} className={b('media-section')}>
            {showMediaTypeLabel && mediaLabel ? (
                <Text variant="subheader-2" className={b('media-title')}>
                    {mediaLabel}
                </Text>
            ) : null}
            {renderUserSummary(section.userData)}
            {renderPhysicalSummary(section.physical)}
        </Flex>
    );
}

export function TenantStorageNew({
    database,
    databaseFullPath,
    metrics,
    blobStorageStats,
    tabletStorageStats,
}: TenantStorageProps) {
    const {currentData, data, error, isFetching} = useTenantStorageNewData({
        database,
        databaseFullPath,
        metrics,
    });
    const loading = isFetching && currentData === undefined;
    const columns = React.useMemo(() => getTopUsageColumns(), []);
    const mediaSections = React.useMemo(() => {
        return buildTenantStorageMediaSections({
            blobStorageStats,
            metrics,
            tabletStorageStats,
        });
    }, [blobStorageStats, metrics, tabletStorageStats]);

    if (error && !currentData) {
        return <ResponseError error={error} />;
    }

    return (
        <LoaderWrapper loading={loading}>
            <Flex direction="column" gap={4} className={b()}>
                {mediaSections.map((section, index) => (
                    <MediaSection
                        key={`${section.mediaType}-${index}`}
                        section={section}
                        showMediaTypeLabel={mediaSections.length > 1}
                    />
                ))}
                <StatsWrapper title={i18n('storage.new.top-space-title')}>
                    <TenantOverviewTableLayout
                        loading={loading}
                        error={error}
                        withData={Boolean(currentData)}
                    >
                        <ResizeableDataTable
                            columnsWidthLSKey={TENANT_STORAGE_COLUMNS_WIDTH_LS_KEY}
                            columns={columns}
                            data={data.topRows}
                            settings={TENANT_OVERVIEW_TABLES_SETTINGS}
                        />
                    </TenantOverviewTableLayout>
                </StatsWrapper>
            </Flex>
        </LoaderWrapper>
    );
}
