import {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import block from 'bem-cn-lite';

import DataTable, {Column} from '@yandex-cloud/react-data-table';

import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useAutofetcher} from '../../../../utils/hooks';
import {Search} from '../../../../components/Search';
import {getDescribe} from '../../../../store/reducers/describe';

import i18n from './i18n';

import './Consumers.scss';

const b = block('ydb-consumers');

interface Consumer {
    name: string;
}

interface ConsumersProps {
    path: string;
}

export const Consumers = ({path}: ConsumersProps) => {
    const dispath = useDispatch();

    const fetchData = () => {
        dispath(getDescribe({path}));
    };

    useAutofetcher(fetchData, [path]);

    const data = useSelector((state: any) => state.describe.data);
    const consumersNames: string[] =
        data[path]?.PathDescription?.PersQueueGroup.PQTabletConfig.ReadRules || [];

    const consumers: Consumer[] = consumersNames.map((name: string) => ({name}));

    const [consumersToRender, setConsumersToRender] = useState<Consumer[]>(consumers);

    useEffect(() => {
        setConsumersToRender(consumers);
    }, [consumersNames]);

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

    if (consumers.length === 0) {
        return <div>{i18n('noConsumersMessage')}</div>;
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
