import {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import block from 'bem-cn-lite';

import {Loader} from '@gravity-ui/uikit';
import DataTable, {Column} from '@yandex-cloud/react-data-table';

import {prepareQueryError} from '../../../../utils/query';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import {Search} from '../../../../components/Search';
import {
    getDescribe,
    selectConsumers,
    setCurrentDescribePath,
    setDataWasNotLoaded,
} from '../../../../store/reducers/describe';

import i18n from './i18n';

import './Consumers.scss';

const b = block('ydb-consumers');

interface ConsumersProps {
    path: string;
}

export const Consumers = ({path}: ConsumersProps) => {
    const dispatch = useDispatch();

    const fetchData = useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }
            dispatch(setCurrentDescribePath(path));
            dispatch(getDescribe({path}));
        },

        [path, dispatch],
    );

    const {autorefresh} = useTypedSelector((state) => state.schema);

    useAutofetcher(fetchData, [fetchData], autorefresh);

    const {loading, wasLoaded, error} = useTypedSelector((state) => state.describe);
    const consumers = useTypedSelector((state) => selectConsumers(state, path));

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

    if (loading && !wasLoaded) {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    }

    if (!loading && error) {
        return <div className={b('message', 'error')}>{prepareQueryError(error)}</div>;
    }

    if (consumers.length === 0) {
        return <div className={b('message')}>{i18n('noConsumersMessage')}</div>;
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
