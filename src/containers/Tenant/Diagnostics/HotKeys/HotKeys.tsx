import {useEffect, useMemo, useRef} from 'react';
import {useDispatch} from 'react-redux';
import DataTable, {type Column} from '@gravity-ui/react-data-table';

import type {HotKey} from '../../../../types/api/hotkeys';
import type {IResponseError} from '../../../../types/api/error';
import {Icon} from '../../../../components/Icon';
import {ResponseError} from '../../../../components/Errors/ResponseError';
import {useTypedSelector} from '../../../../utils/hooks';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {
    setHotKeysData,
    setHotKeysDataWasNotLoaded,
    setHotKeysError,
    setHotKeysLoading,
} from '../../../../store/reducers/hotKeys/hotKeys';

import './HotKeys.scss';
import i18n from './i18n';

const b = cn('ydb-hot-keys');

const tableColumnsIds = {
    accessSample: 'accessSample',
    keyValues: 'keyValues',
} as const;

const getHotKeysColumns = (keyColumnsIds: string[] = []): Column<HotKey>[] => {
    const keysColumns: Column<HotKey>[] = keyColumnsIds.map((col, index) => ({
        name: col,
        header: (
            <div className={b('primary-key-column')}>
                <Icon name="key" viewBox="0 0 12 7" width={12} height={7} />
                {col}
            </div>
        ),
        render: ({row}) => row.keyValues[index],
        align: DataTable.RIGHT,
        sortable: false,
    }));

    return [
        {
            name: tableColumnsIds.accessSample,
            header: 'Samples',
            render: ({row}) => row.accessSample,
            align: DataTable.RIGHT,
            sortable: false,
        },
        ...keysColumns,
    ];
};

interface HotKeysProps {
    path: string;
}

export function HotKeys({path}: HotKeysProps) {
    const dispatch = useDispatch();

    const collectSamplesTimerRef = useRef<ReturnType<typeof setTimeout>>();

    const {loading, wasLoaded, data, error} = useTypedSelector((state) => state.hotKeys);
    const {loading: schemaLoading, data: schemaData} = useTypedSelector((state) => state.schema);

    const keyColumnsIds = schemaData[path]?.PathDescription?.Table?.KeyColumnNames;

    const tableColumns = useMemo(() => {
        return getHotKeysColumns(keyColumnsIds);
    }, [keyColumnsIds]);

    useEffect(() => {
        const fetchHotkeys = async (enableSampling: boolean) => {
            // Set hotkeys error, but not data, since data is set conditionally
            try {
                const response = await window.api.getHotKeys(path, enableSampling);
                return response;
            } catch (err) {
                dispatch(setHotKeysError(err as IResponseError));
                return undefined;
            }
        };

        const fetchData = async () => {
            // If there is previous pending request for samples, cancel it
            if (collectSamplesTimerRef.current !== undefined) {
                window.clearInterval(collectSamplesTimerRef.current);
            }

            dispatch(setHotKeysDataWasNotLoaded());
            dispatch(setHotKeysLoading());

            // Send request that will trigger hot keys sampling (enable_sampling = true)
            const initialResponse = await fetchHotkeys(true);

            // If there are hotkeys in the initial request (hotkeys was collected before)
            // we could just use colleted samples (collected hotkeys are stored only for 30 seconds)
            if (initialResponse && initialResponse.hotkeys) {
                dispatch(setHotKeysData(initialResponse));
            } else if (initialResponse) {
                // Else wait for 5 seconds, while hot keys are being collected
                // And request these samples (enable_sampling = false)
                const timer = setTimeout(async () => {
                    const responseWithSamples = await fetchHotkeys(false);
                    if (responseWithSamples) {
                        dispatch(setHotKeysData(responseWithSamples));
                    }
                }, 5000);
                collectSamplesTimerRef.current = timer;
            }
        };
        fetchData();
    }, [dispatch, path]);

    // It takes a while to collect hot keys. Display explicit status message, while collecting
    if ((loading && !wasLoaded) || schemaLoading) {
        return <div>{i18n('hot-keys-collecting')}</div>;
    }

    if (error) {
        return <ResponseError error={error} />;
    }

    if (!data) {
        return <div>{i18n('no-data')}</div>;
    }

    return (
        <div className={b('table-content')}>
            <DataTable
                columns={tableColumns}
                data={data}
                settings={DEFAULT_TABLE_SETTINGS}
                theme="yandex-cloud"
                initialSortOrder={{
                    columnId: tableColumnsIds.accessSample,
                    order: DataTable.DESCENDING,
                }}
            />
        </div>
    );
}
