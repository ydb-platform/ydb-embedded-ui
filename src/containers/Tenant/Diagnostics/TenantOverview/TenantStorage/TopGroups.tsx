import cn from 'bem-cn-lite';
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import DataTable from '@gravity-ui/react-data-table';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {DEFAULT_TABLE_SETTINGS} from '../../../../../utils/constants';
import {STORAGE_SORT_VALUES} from '../../../../../utils/storage';
import {
    setDataWasNotLoaded,
    getTopStorageGroups,
    selectTopStorageGroups,
} from '../../../../../store/reducers/topStorageGroups/topStorageGroups';
import {EVersion} from '../../../../../types/api/storage';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {TableSkeleton} from '../../../../../components/TableSkeleton/TableSkeleton';
import {getStorageTopGroupsColumns} from '../../../../Storage/StorageGroups/getStorageGroupsColumns';
import i18n from '../i18n';

const b = cn('tenant-overview-storage');

interface TopGroupsProps {
    tenant?: string;
}

export function TopGroups({tenant}: TopGroupsProps) {
    const dispatch = useDispatch();

    const {autorefresh} = useTypedSelector((state) => state.schema);
    const {loading, wasLoaded, error} = useTypedSelector((state) => state.topStorageGroups);
    const topGroups = useTypedSelector(selectTopStorageGroups);

    const columns = getStorageTopGroupsColumns();

    const fetchData = useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(
                getTopStorageGroups({
                    tenant,
                    visibleEntities: 'all',
                    limit: 5,
                    sortOrder: -1,
                    sortValue: STORAGE_SORT_VALUES.Usage,
                    version: EVersion.v2,
                }),
            );
        },
        [dispatch, tenant],
    );

    useAutofetcher(fetchData, [fetchData], autorefresh);

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} />;
        }

        if (loading && !wasLoaded) {
            return <TableSkeleton rows={5} />;
        }

        return (
            <DataTable
                theme="yandex-cloud"
                data={topGroups || []}
                columns={columns}
                settings={{...DEFAULT_TABLE_SETTINGS, stickyHead: 'fixed', dynamicRender: false}}
                emptyDataMessage={i18n('top-groups.empty-data')}
            />
        );
    };

    return (
        <>
            <div className={b('title')}>Top groups by usage</div>
            <div className={b('table')}>{renderContent()}</div>
        </>
    );
}
