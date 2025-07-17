import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {skipToken} from '@reduxjs/toolkit/query';

import {InfoViewerSkeleton} from '../../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {vDiskApi} from '../../../store/reducers/vdisk/vdisk';
import type {VDiskBlobIndexItem} from '../../../types/api/vdiskBlobIndex';
import {cn} from '../../../utils/cn';
import {useAutoRefreshInterval} from '../../../utils/hooks';

import {getColumns} from './columns';
import {vDiskPageKeyset} from '../i18n';

import './VDiskTablets.scss';

const vDiskTabletsCn = cn('ydb-vdisk-tablets');
const VDISK_TABLETS_COLUMNS_WIDTH_LS_KEY = 'vdiskTabletsColumnsWidth';

const TABLE_SETTINGS = {
    displayIndices: false,
    highlightRows: true,
    stickyHead: DataTable.MOVING,
};

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

        stat.tablets.forEach((tablet: any) => {
            const tabletId = tablet.tablet_id;
            if (!tabletId || !Array.isArray(tablet.channels)) {
                return; // Skip tablets without ID or channels
            }

            tablet.channels.forEach((channel: any, channelIndex: number) => {
                // Only include channels that have count and data_size
                if (channel.count && channel.data_size) {
                    flatData.push({
                        TabletId: tabletId,
                        ChannelId: channelIndex,
                        Count: parseInt(channel.count, 10) || 0,
                        Size: parseInt(channel.data_size, 10) || 0,
                    });
                }
            });
        });

        return flatData;
    }, [currentData]);

    const columns = React.useMemo(() => getColumns(), []);

    if (error) {
        return (
            <div className={vDiskTabletsCn('error', className)}>
                Error loading tablet statistics
            </div>
        );
    }

    if (loading) {
        return <InfoViewerSkeleton rows={5} />;
    }

    return (
        <div className={vDiskTabletsCn(null, className)}>
            <ResizeableDataTable
                columnsWidthLSKey={VDISK_TABLETS_COLUMNS_WIDTH_LS_KEY}
                data={tableData}
                columns={columns}
                settings={TABLE_SETTINGS}
                loading={loading}
                initialSortOrder={{
                    columnId: vDiskPageKeyset('size'),
                    order: DataTable.DESCENDING,
                }}
            />
        </div>
    );
}
