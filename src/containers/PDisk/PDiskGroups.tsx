import {useMemo} from 'react';

import DataTable from '@gravity-ui/react-data-table';

import type {PreparedStorageGroup} from '../../store/reducers/storage/types';
import type {NodesMap} from '../../types/store/nodesList';

import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';

import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';

import {getPDiskStorageColumns} from '../Storage/StorageGroups/getStorageGroupsColumns';

import {pdiskPageCn} from './shared';
import {pDiskPageKeyset} from './i18n';

interface PDiskGroupsProps {
    data: PreparedStorageGroup[];
    nodesMap?: NodesMap;
    loading?: boolean;
}

export function PDiskGroups({data, nodesMap, loading}: PDiskGroupsProps) {
    const pDiskStorageColumns = useMemo(() => {
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
        <>
            <div className={pdiskPageCn('groups-title')}>{pDiskPageKeyset('groups')}</div>
            <div>{renderContent()}</div>
        </>
    );
}
