import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import {PageError} from '../../../components/Errors/PageError/PageError';
import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../../components/TableWithControlsLayout/TableWithControlsLayout';
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
    scrollContainerRef: React.RefObject<HTMLElement>;
}

export function VDiskTablets({
    nodeId,
    pDiskId,
    vDiskSlotId,
    className,
    scrollContainerRef,
}: VDiskTabletsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {currentData, isFetching, error} = vDiskApi.useGetVDiskBlobIndexStatQuery(
        !isNil(nodeId) && !isNil(pDiskId) && !isNil(vDiskSlotId)
            ? {nodeId, pDiskId, vDiskSlotId}
            : skipToken,
        {
            pollingInterval: autoRefreshInterval,
        },
    );

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

    return (
        <div className={className}>
            <TableWithControlsLayout.Table
                scrollContainerRef={scrollContainerRef}
                loading={loading}
            >
                <ResizeableDataTable
                    columnsWidthLSKey={VDISK_TABLETS_COLUMNS_WIDTH_LS_KEY}
                    data={tableData}
                    columns={columns}
                    settings={DEFAULT_TABLE_SETTINGS}
                    initialSortOrder={{
                        columnId: vDiskPageKeyset('size'),
                        order: DataTable.DESCENDING,
                    }}
                />
            </TableWithControlsLayout.Table>
        </div>
    );
}
