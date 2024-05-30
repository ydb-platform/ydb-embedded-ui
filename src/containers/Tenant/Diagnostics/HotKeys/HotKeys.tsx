import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import DataTable from '@gravity-ui/react-data-table';
import type {Column} from '@gravity-ui/react-data-table';
import {Button, Card, Icon} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {
    setHotKeysData,
    setHotKeysDataWasNotLoaded,
    setHotKeysError,
    setHotKeysLoading,
} from '../../../../store/reducers/hotKeys/hotKeys';
import type {IResponseError} from '../../../../types/api/error';
import type {HotKey} from '../../../../types/api/hotkeys';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS, IS_HOTKEYS_HELP_HIDDDEN_KEY} from '../../../../utils/constants';
import {useSetting, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';

import i18n from './i18n';

import keyIcon from '../../../../assets/icons/key.svg';

import './HotKeys.scss';

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
                <Icon data={keyIcon} width={12} height={7} />
                {col}
            </div>
        ),
        render: ({row}) => row.keyValues[index],
        align: DataTable.RIGHT,
        sortable: false,
    }));

    return [
        ...keysColumns,
        {
            name: tableColumnsIds.accessSample,
            header: 'Samples',
            render: ({row}) => row.accessSample,
            align: DataTable.RIGHT,
            sortable: false,
        },
    ];
};

interface HotKeysProps {
    path: string;
}

export function HotKeys({path}: HotKeysProps) {
    const dispatch = useTypedDispatch();

    const [helpHidden, setHelpHidden] = useSetting(IS_HOTKEYS_HELP_HIDDDEN_KEY);

    const collectSamplesTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

    const {loading, wasLoaded, data, error} = useTypedSelector((state) => state.hotKeys);
    const {loading: schemaLoading, data: schemaData} = useTypedSelector((state) => state.schema);

    const keyColumnsIds = schemaData[path]?.PathDescription?.Table?.KeyColumnNames;

    const tableColumns = React.useMemo(() => {
        return getHotKeysColumns(keyColumnsIds);
    }, [keyColumnsIds]);

    React.useEffect(() => {
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

    const renderContent = () => {
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
            <ResizeableDataTable
                wrapperClassName={b('table')}
                columns={tableColumns}
                data={data}
                settings={DEFAULT_TABLE_SETTINGS}
                initialSortOrder={{
                    columnId: tableColumnsIds.accessSample,
                    order: DataTable.DESCENDING,
                }}
            />
        );
    };

    const renderHelpCard = () => {
        if (helpHidden) {
            return null;
        }

        return (
            <Card theme="info" view="filled" type="container" className={b('help-card')}>
                {i18n('help')}
                <Button
                    className={b('help-card__close-button')}
                    view="flat"
                    onClick={() => setHelpHidden(true)}
                >
                    <Icon data={Xmark} size={18} />
                </Button>
            </Card>
        );
    };

    return (
        <React.Fragment>
            {renderHelpCard()}
            {renderContent()}
        </React.Fragment>
    );
}
