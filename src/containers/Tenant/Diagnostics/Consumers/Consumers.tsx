import {useEffect, useMemo, useState} from 'react';
import {useDispatch} from 'react-redux';
import block from 'bem-cn-lite';

import DataTable, {Column} from '@yandex-cloud/react-data-table';
import {Loader} from '@gravity-ui/uikit';

import {EPathType} from '../../../../types/api/schema';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import {Search} from '../../../../components/Search';
import {getDescribe, selectConsumers} from '../../../../store/reducers/describe';

import i18n from './i18n';

import './Consumers.scss';

const b = block('ydb-consumers');

interface ConsumersProps {
    path: string;
    pathType?: EPathType;
    schemaNestedChildrenPaths?: string[];
}

export const Consumers = ({path, pathType, schemaNestedChildrenPaths}: ConsumersProps) => {
    const dispath = useDispatch();

    const {loading, wasLoaded} = useTypedSelector((state) => state.describe);
    const {autorefresh} = useTypedSelector((state) => state.schema);

    const isCdcStream = pathType === EPathType.EPathTypeCdcStream;

    const targetPath = useMemo(
        () =>
            // Since every CDC Stream have only one nested PersQueueGroup, we select only first item
            isCdcStream ? schemaNestedChildrenPaths && schemaNestedChildrenPaths[0] : path,
        [path, pathType, schemaNestedChildrenPaths],
    );

    const fetchData = (resetLoadingState: boolean) => {
        // For PersQueueTopic targetPath is defined
        // For CDC Stream path become defined when schema is loaded
        // as it loads no its own data, but data of the child
        if (targetPath) {
            dispath(
                getDescribe(
                    {path: targetPath},
                    {resetLoadingState, currentDescribePath: targetPath},
                ),
            );
        }
    };

    useAutofetcher(
        (isBackground) => fetchData(!isBackground),
        [path, pathType, schemaNestedChildrenPaths],
        autorefresh,
    );

    const consumers = useTypedSelector((state) => selectConsumers(state, targetPath));

    const [consumersToRender, setConsumersToRender] = useState(consumers);

    useEffect(() => {
        setConsumersToRender(consumers);
    }, [consumers]);

    const filterConsumersByName = (search: string) => {
        const filteredConsumers = search
            ? consumers.filter((consumer) => {
                  const re = new RegExp(search, 'i');
                  return re.test(consumer.name);
              })
            : consumers;

        setConsumersToRender(filteredConsumers);
    };

    const handleSearch = (value: string) => {
        filterConsumersByName(value);
    };

    const columns: Column<any>[] = [
        {
            name: 'name',
            header: i18n('table.columns.consumerName'),
            width: 200,
        },
    ];

    if ((loading && !wasLoaded) || (isCdcStream && !targetPath)) {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    }

    if (consumers.length === 0) {
        return <div className={b()}>{i18n('noConsumersMessage')}</div>;
    }

    return (
        <div className={b()}>
            <Search
                onChange={handleSearch}
                placeholder={i18n('search.placeholder')}
                className={b('search')}
            />
            <DataTable
                theme="yandex-cloud"
                settings={DEFAULT_TABLE_SETTINGS}
                columns={columns}
                data={consumersToRender}
                emptyDataMessage={i18n('table.emptyDataMessage')}
            />
        </div>
    );
};
