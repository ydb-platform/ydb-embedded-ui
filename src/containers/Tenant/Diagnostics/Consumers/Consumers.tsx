import {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import block from 'bem-cn-lite';

import DataTable, {Column} from '@yandex-cloud/react-data-table';

import {IRootState} from '../../../../types/store';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useAutofetcher} from '../../../../utils/hooks';
import {Search} from '../../../../components/Search';
import {getDescribe, selectConsumers} from '../../../../store/reducers/describe';

import i18n from './i18n';

import './Consumers.scss';

const b = block('ydb-consumers');

interface ConsumersProps {
    path: string;
}

export const Consumers = ({path}: ConsumersProps) => {
    const dispath = useDispatch();

    const fetchData = () => {
        dispath(getDescribe({path}));
    };

    useAutofetcher(fetchData, [path]);

    const consumers = useSelector((state: IRootState) => selectConsumers(state, path));

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
