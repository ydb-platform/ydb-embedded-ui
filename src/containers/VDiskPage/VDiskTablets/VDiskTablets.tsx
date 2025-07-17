import React from 'react';

import {useTable} from '@gravity-ui/table';
import {skipToken} from '@reduxjs/toolkit/query';
import type {SortingState} from '@tanstack/react-table';

import {InfoViewerSkeleton} from '../../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {Table} from '../../../components/Table/Table';
import {vDiskApi} from '../../../store/reducers/vdisk/vdisk';
import type {VDiskBlobIndexItem} from '../../../types/api/vdiskBlobIndex';
import {cn} from '../../../utils/cn';
import {useAutoRefreshInterval} from '../../../utils/hooks';

import {getColumns} from './columns';

import './VDiskTablets.scss';

const vDiskTabletsCn = cn('ydb-vdisk-tablets');

interface VDiskTabletsProps {
    nodeId?: string | number;
    pDiskId?: string | number;
    vDiskSlotId?: string | number;
    className?: string;
}

export function VDiskTablets({nodeId, pDiskId, vDiskSlotId, className}: VDiskTabletsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [sorting, setSorting] = React.useState<SortingState>([
        {id: 'Size', desc: true}, // Default sort by size descending
    ]);

    const params = nodeId && pDiskId && vDiskSlotId ? {nodeId, pDiskId, vDiskSlotId} : skipToken;

    const {currentData, isFetching, error} = vDiskApi.useGetVDiskBlobIndexStatQuery(params, {
        pollingInterval: autoRefreshInterval,
    });

    const loading = isFetching && currentData === undefined;

    // Remove the manual sorting since we'll let the table handle it with enableSorting
    const tableData: VDiskBlobIndexItem[] = React.useMemo(() => {
        if (!currentData) {
            return [];
        }

        // Debug: Log the actual response structure
        console.info('VDisk BlobIndexStat Response:', currentData);

        // Check if we have the expected structure: {stat: {tablets: [...]}}
        const stat = currentData.stat;
        if (!stat || !Array.isArray(stat.tablets)) {
            console.info('No stat.tablets array found in response');
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

        console.info('Transformed data:', flatData);
        return flatData;
    }, [currentData]);

    const columns = React.useMemo(() => getColumns(), []);

    const table = useTable({
        columns,
        data: tableData,
        enableSorting: true,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        onSortingChange: setSorting,
        state: {
            sorting,
        },
    });

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
            <Table table={table} stickyHeader width="max" />
        </div>
    );
}
