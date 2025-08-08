import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {skipToken} from '@reduxjs/toolkit/query';

import {PageError} from '../../../components/Errors/PageError/PageError';
import {InfoViewerSkeleton} from '../../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {vDiskApi} from '../../../store/reducers/vdisk/vdisk';
import type {VDiskBlobIndexItem} from '../../../types/api/vdiskBlobIndex';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {useAutoRefreshInterval} from '../../../utils/hooks';
import {safeParseNumber} from '../../../utils/utils';
import {vDiskPageKeyset} from '../i18n';

import {getColumns} from './columns';

const VDISK_TABLETS_COLUMNS_WIDTH_LS_KEY = 'vdiskTabletsColumnsWidth';

const columns = getColumns();

interface VDiskTabletsProps {
    nodeId?: string | number;
    pDiskId?: string | number;
    vDiskSlotId?: string | number;
    className?: string;
}

export function VDiskTablets({nodeId, pDiskId, vDiskSlotId, className}: VDiskTabletsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const params = nodeId && pDiskId && vDiskSlotId ? {nodeId, pDiskId, vDiskSlotId} : skipToken;

    const {currentData, isFetching, error} = vDiskApi.useGetVDiskBlobIndexStatQuery(params, {
        pollingInterval: autoRefreshInterval,
    });

    const loading = isFetching && currentData === undefined;

    const tableData: VDiskBlobIndexItem[] = React.useMemo(() => {
        if (!currentData) {
            return [];
        }

        // Check if we have the expected structure: {stat: {tablets: [...]}}
        const stat = currentData.stat;
        if (!stat || !Array.isArray(stat.tablets)) {
            return [];
        }

        // Transform the nested structure into flat table rows
        const flatData: VDiskBlobIndexItem[] = [];

        stat.tablets.forEach((tablet) => {
            const tabletId = tablet.tablet_id;
            if (!tabletId || !Array.isArray(tablet.channels)) {
                return; // Skip tablets without ID or channels
            }

            tablet.channels.forEach((channel, channelIndex) => {
                // Only include channels that have count and data_size
                if (channel.count && channel.data_size) {
                    flatData.push({
                        TabletId: tabletId,
                        ChannelId: channelIndex,
                        Count: safeParseNumber(channel.count),
                        Size: safeParseNumber(channel.data_size),
                    });
                }
            });
        });

        return flatData;
    }, [currentData]);

    if (error) {
        return <PageError error={error} position="left" size="s" />;
    }

    if (loading) {
        return <InfoViewerSkeleton rows={5} />;
    }

    return (
        <div className={className}>
            <ResizeableDataTable
                columnsWidthLSKey={VDISK_TABLETS_COLUMNS_WIDTH_LS_KEY}
                data={tableData}
                columns={columns}
                settings={DEFAULT_TABLE_SETTINGS}
                loading={loading}
                initialSortOrder={{
                    columnId: vDiskPageKeyset('size'),
                    order: DataTable.DESCENDING,
                }}
            />
        </div>
    );
}
