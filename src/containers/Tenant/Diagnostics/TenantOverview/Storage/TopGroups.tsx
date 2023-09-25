import cn from 'bem-cn-lite';
import {useCallback, useEffect} from 'react';
import {useDispatch} from 'react-redux';

import DataTable from '@gravity-ui/react-data-table';

import {useAutofetcher, useTypedSelector} from '../../../../../utils/hooks';
import {DEFAULT_TABLE_SETTINGS} from '../../../../../utils/constants';
import {STORAGE_SORT_VALUES} from '../../../../../utils/storage';
import {selectFilteredGroups} from '../../../../../store/reducers/storage/selectors';
import {getStorageTopGroupsColumns} from '../../../../Storage/StorageGroups/getStorageGpoupsColumns';
import {
    getStorageGroupsInfo,
    setDataWasNotLoaded,
    setInitialState,
} from '../../../../../store/reducers/storage/storage';
import {EVersion} from '../../../../../types/api/storage';
import {AccessDenied} from '../../../../../components/Errors/403';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {TableSkeleton} from '../../../../../components/TableSkeleton/TableSkeleton';
import i18n from '../i18n';

const b = cn('tenant-overview-storage');

interface TopGroupsProps {
    tenant?: string;
}

export function TopGroups({tenant}: TopGroupsProps) {
    const dispatch = useDispatch();

    const {autorefresh} = useTypedSelector((state) => state.schema);
    const {loading, wasLoaded, error} = useTypedSelector((state) => state.storage);
    const storageGroups = useTypedSelector(selectFilteredGroups);

    const columns = getStorageTopGroupsColumns();

    useEffect(() => {
        return () => {
            // Clean data on component unmount
            dispatch(setInitialState());
        };
    }, [dispatch]);

    const fetchData = useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(
                getStorageGroupsInfo({
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
            if (error.status === 403) {
                return <AccessDenied />;
            }
            return <ResponseError error={error} />;
        }

        if (loading && !wasLoaded) {
            return <TableSkeleton rows={5} />;
        }

        return (
            <DataTable
                theme="yandex-cloud"
                data={storageGroups.slice(0, 5)}
                columns={columns}
                settings={DEFAULT_TABLE_SETTINGS}
                emptyDataMessage={i18n('top-groups.empty-data')}
            />
        );
    };

    return (
        <>
            <div className={b('title')}>Top groups by usage</div>
            <div className={b('top-tables')}>{renderContent()}</div>
        </>
    );
}
