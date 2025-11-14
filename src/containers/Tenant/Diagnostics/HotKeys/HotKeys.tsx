import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import DataTable from '@gravity-ui/react-data-table';
import type {Column} from '@gravity-ui/react-data-table';
import {Button, Card, Icon} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {hotKeysApi} from '../../../../store/reducers/hotKeys/hotKeys';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import type {HotKey} from '../../../../types/api/hotkeys';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useAutoRefreshInterval, useSetting} from '../../../../utils/hooks';

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
    database: string;
    databaseFullPath: string;
    path: string;
}

export function HotKeys({path, database, databaseFullPath}: HotKeysProps) {
    const {
        currentData: data,
        isFetching,
        error,
    } = hotKeysApi.useGetHotKeysQuery({path, database, databaseFullPath});
    const loading = isFetching && data === undefined;
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData: schemaData, isLoading: schemaLoading} = overviewApi.useGetOverviewQuery(
        {
            path,
            database,
            databaseFullPath,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );
    const keyColumnsIds = schemaData?.PathDescription?.Table?.KeyColumnNames;

    const tableColumns = React.useMemo(() => {
        return getHotKeysColumns(keyColumnsIds);
    }, [keyColumnsIds]);

    const renderContent = () => {
        // It takes a while to collect hot keys. Display explicit status message, while collecting
        if (loading || schemaLoading) {
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

    return (
        <React.Fragment>
            <HelpCard />
            {renderContent()}
        </React.Fragment>
    );
}

function HelpCard() {
    const [helpHidden, setHelpHidden] = useSetting(SETTING_KEYS.IS_HOTKEYS_HELP_HIDDEN);

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
}
