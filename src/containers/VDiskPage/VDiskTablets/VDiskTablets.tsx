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
    
    // Debug: Log the actual response to understand the structure
    React.useEffect(() => {
        if (currentData) {
            console.log('VDisk BlobIndexStat Response:', currentData);
            console.log('Response keys:', Object.keys(currentData));
            console.log('BlobIndexStat field:', currentData.BlobIndexStat);
            console.log('blobIndexStat field:', currentData.blobIndexStat);
            console.log('blobindexstat field:', currentData.blobindexstat);
            console.log('result field:', currentData.result);
            console.log('data field:', currentData.data);
        }
    }, [currentData]);
    
    // Try multiple possible field names for the data array
    const tableData: VDiskBlobIndexItem[] = React.useMemo(() => {
        if (!currentData) return [];
        
        // Try different possible field names
        const possibleFields = [
            currentData.BlobIndexStat,
            currentData.blobIndexStat,
            currentData.blobindexstat,
            currentData.result,
            currentData.data,
        ];
        
        for (const field of possibleFields) {
            if (Array.isArray(field)) {
                console.log('Using field:', field);
                return field;
            }
        }
        
        // If none of the expected fields work, try to find any array in the response
        for (const [key, value] of Object.entries(currentData)) {
            if (Array.isArray(value)) {
                console.log('Found array field:', key, value);
                return value;
            }
        }
        
        console.log('No array found in response, returning empty array');
        return [];
    }, [currentData]);

    // Sort by size descending by default
    const sortedData = React.useMemo(() => {
        return [...tableData].sort((a, b) => {
            const sizeA = Number(a.Size ?? a.size) || 0;
            const sizeB = Number(b.Size ?? b.size) || 0;
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
