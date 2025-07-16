import React from 'react';

import {useTable} from '@gravity-ui/table';
import {skipToken} from '@reduxjs/toolkit/query';

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

    const params = nodeId && pDiskId && vDiskSlotId ? {nodeId, pDiskId, vDiskSlotId} : skipToken;

    const {currentData, isFetching, error} = vDiskApi.useGetVDiskBlobIndexStatQuery(params, {
        pollingInterval: autoRefreshInterval,
    });

    const loading = isFetching && currentData === undefined;
    const tableData: VDiskBlobIndexItem[] = currentData?.BlobIndexStat || [];

    // Sort by size descending by default
    const sortedData = React.useMemo(() => {
        return [...tableData].sort((a, b) => {
            const sizeA = Number(a.Size) || 0;
            const sizeB = Number(b.Size) || 0;
            return sizeB - sizeA;
        });
    }, [tableData]);

    const columns = React.useMemo(() => getColumns(), []);

    const table = useTable({
        columns,
        data: sortedData,
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
            <Table table={table} />
        </div>
    );
}
