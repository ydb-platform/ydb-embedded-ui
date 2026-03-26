import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {Button, Flex, HelpMark, Label, Text} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import type {StorageUsageGroupRow} from '../../../../store/reducers/storageUsage/StorageUsage';
import {cn} from '../../../../utils/cn';
import {TENANT_OVERVIEW_TABLES_SETTINGS} from '../../../../utils/constants';
import {formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import type {Column} from '../../../../utils/tableUtils/types';
import {StatsWrapper} from '../TenantOverview/StatsWrapper/StatsWrapper';
import i18n from '../i18n';

import {
    STORAGE_USAGE_INITIAL_ROWS_COUNT,
    formatMetricBytes,
    formatShare,
    getSharePercent,
} from './storageUsageFormatters';

import './StorageUsageTable.scss';

const b = cn('ydb-storage-usage-table');

const STORAGE_USAGE_COLUMN_WIDTHS = {
    groupId: 152,
    used: 130,
    limit: 130,
    share: 200,
} as const;
const STORAGE_USAGE_COLUMNS_IDS = {
    groupId: 'groupId',
    used: 'used',
    limit: 'limit',
    share: 'share',
} as const;

interface StorageUsageTableProps {
    getStorageGroupPath: (groupId: string) => string;
    hasMultipleMediaTypes: boolean;
    hiddenRowsCount: number;
    onShowMore: () => void;
    rows: StorageUsageGroupRow[];
    storageGroupsCount?: number;
    visibleRows: StorageUsageGroupRow[];
}

function HeaderWithHelp({text, note}: {text: string; note?: string}) {
    return (
        <Flex alignItems="center" gap="1">
            <span>{text}</span>
            {note ? <HelpMark iconSize="s">{note}</HelpMark> : null}
        </Flex>
    );
}

function renderStorageGroupName(name?: string) {
    return (
        <Text variant="body-1" as="span">
            {name ?? ''}
        </Text>
    );
}

function getFixedColumnStyle(width: number) {
    return {
        width,
        minWidth: width,
        maxWidth: width,
    };
}

function StorageGroupCell({
    groupId,
    erasure,
    hasMultipleMediaTypes,
    mediaType,
    getStorageGroupPath,
}: Pick<StorageUsageGroupRow, 'groupId' | 'erasure' | 'mediaType'> & {
    getStorageGroupPath: (groupId: string) => string;
    hasMultipleMediaTypes: boolean;
}) {
    return (
        <Flex direction="column">
            <Flex alignItems="center" gap="2">
                <EntityStatus
                    name={groupId}
                    path={getStorageGroupPath(groupId)}
                    renderName={renderStorageGroupName}
                    hasClipboardButton
                    showStatus={false}
                />
                {hasMultipleMediaTypes && mediaType ? (
                    <Label theme="unknown" size="xs" className={b('media-chip')}>
                        {mediaType}
                    </Label>
                ) : null}
            </Flex>
            {erasure ? (
                <Text variant="caption-2" color="secondary">
                    {erasure}
                </Text>
            ) : null}
        </Flex>
    );
}

function ShareCell({share}: Pick<StorageUsageGroupRow, 'share'>) {
    const sharePercent = getSharePercent(share);
    const progressWidth = `${sharePercent}%`;

    return (
        <Flex alignItems="center" gap="2" className={b('share-cell')}>
            <div
                className={b('share-progress')}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={sharePercent}
            >
                <div className={b('share-progress-fill')} style={{width: progressWidth}} />
            </div>
            <Text className={b('share-value')}>{formatShare(share)}</Text>
        </Flex>
    );
}

export function StorageUsageTable({
    getStorageGroupPath,
    hasMultipleMediaTypes,
    hiddenRowsCount,
    onShowMore,
    rows,
    storageGroupsCount,
    visibleRows,
}: StorageUsageTableProps) {
    const columns = React.useMemo<Column<StorageUsageGroupRow>[]>(() => {
        return [
            {
                name: STORAGE_USAGE_COLUMNS_IDS.groupId,
                header: i18n('field_storage-usage-group'),
                width: STORAGE_USAGE_COLUMN_WIDTHS.groupId,
                customStyle: () => getFixedColumnStyle(STORAGE_USAGE_COLUMN_WIDTHS.groupId),
                align: DataTable.LEFT,
                resizeable: false,
                render: ({row}) => (
                    <StorageGroupCell
                        erasure={row.erasure}
                        getStorageGroupPath={getStorageGroupPath}
                        groupId={row.groupId}
                        hasMultipleMediaTypes={hasMultipleMediaTypes}
                        mediaType={row.mediaType}
                    />
                ),
            },
            {
                name: STORAGE_USAGE_COLUMNS_IDS.used,
                header: (
                    <HeaderWithHelp
                        text={i18n('field_storage-usage-used')}
                        note={i18n('context_storage-usage-used-description')}
                    />
                ),
                width: STORAGE_USAGE_COLUMN_WIDTHS.used,
                customStyle: () => getFixedColumnStyle(STORAGE_USAGE_COLUMN_WIDTHS.used),
                align: DataTable.LEFT,
                resizeable: false,
                render: ({row}) => (
                    <Text variant="body-1" as="span">
                        {formatMetricBytes(row.used)}
                    </Text>
                ),
            },
            {
                name: STORAGE_USAGE_COLUMNS_IDS.limit,
                header: (
                    <HeaderWithHelp
                        text={i18n('field_storage-usage-limit')}
                        note={i18n('context_storage-usage-limit-description')}
                    />
                ),
                width: STORAGE_USAGE_COLUMN_WIDTHS.limit,
                customStyle: () => getFixedColumnStyle(STORAGE_USAGE_COLUMN_WIDTHS.limit),
                align: DataTable.LEFT,
                resizeable: false,
                render: ({row}) => (
                    <Text variant="body-1" as="span">
                        {formatMetricBytes(row.limit)}
                    </Text>
                ),
            },
            {
                name: STORAGE_USAGE_COLUMNS_IDS.share,
                header: (
                    <HeaderWithHelp
                        text={i18n('field_storage-usage-share')}
                        note={i18n('context_storage-usage-share-description')}
                    />
                ),
                width: STORAGE_USAGE_COLUMN_WIDTHS.share,
                customStyle: () => getFixedColumnStyle(STORAGE_USAGE_COLUMN_WIDTHS.share),
                align: DataTable.LEFT,
                resizeable: false,
                render: ({row}) => <ShareCell share={row.share} />,
            },
        ];
    }, [getStorageGroupPath, hasMultipleMediaTypes]);

    if (rows.length === 0) {
        return null;
    }

    return (
        <Flex direction="column" gap="3" className={b()}>
            <Flex alignItems="baseline" gap="1" className={b('title')}>
                <Text variant="subheader-2">
                    {i18n('title_storage-usage-storage-groups-usage')}
                </Text>
                <Text variant="subheader-2" color="hint" className={b('title-count')}>
                    {formatNumber(storageGroupsCount) || '0'}
                </Text>
            </Flex>
            <StatsWrapper className={b('wrapper')} title={null}>
                <ResizeableDataTable
                    columns={columns}
                    data={visibleRows}
                    reserveResizePadding={false}
                    settings={TENANT_OVERVIEW_TABLES_SETTINGS}
                    loadingSkeletonRowsCount={STORAGE_USAGE_INITIAL_ROWS_COUNT}
                />
                {hiddenRowsCount > 0 ? (
                    <Button view="flat-secondary" className={b('show-more')} onClick={onShowMore}>
                        {i18n('action_storage-usage-show-more', {
                            count: formatNumber(hiddenRowsCount) || '0',
                        })}
                    </Button>
                ) : null}
            </StatsWrapper>
        </Flex>
    );
}
