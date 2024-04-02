import React from 'react';

import DataTable from '@gravity-ui/react-data-table';

import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';
import type {PreparedStorageGroup} from '../../store/reducers/storage/types';
import type {NodesMap} from '../../types/store/nodesList';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {getPDiskStorageColumns} from '../Storage/StorageGroups/getStorageGroupsColumns';

import {pDiskPageKeyset} from './i18n';
import {pdiskPageCn} from './shared';

interface PDiskGroupsProps {
    data: PreparedStorageGroup[];
    nodesMap?: NodesMap;
    loading?: boolean;
}

export function PDiskGroups({data, nodesMap, loading}: PDiskGroupsProps) {
    const pDiskStorageColumns = React.useMemo(() => {
        return getPDiskStorageColumns(nodesMap);
    }, [nodesMap]);

    const renderContent = () => {
        if (loading) {
            return <TableSkeleton />;
        }

        return (
            <DataTable
                theme="yandex-cloud"
                data={data}
                columns={pDiskStorageColumns}
                settings={DEFAULT_TABLE_SETTINGS}
            />
        );
    };

    return (
        <React.Fragment>
            <div className={pdiskPageCn('groups-title')}>{pDiskPageKeyset('groups')}</div>
            <div>{renderContent()}</div>
        </React.Fragment>
    );
}
