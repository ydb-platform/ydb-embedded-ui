import {useCallback, useMemo, useState} from 'react';
import {useDispatch} from 'react-redux';
import block from 'bem-cn-lite';
import {escapeRegExp} from 'lodash/fp';

import DataTable from '@gravity-ui/react-data-table';

import type {EPathType} from '../../../../types/api/schema';

import {Loader} from '../../../../components/Loader';
import {Search} from '../../../../components/Search';
import {ResponseError} from '../../../../components/Errors/ResponseError';

import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';

import {
    selectPreparedConsumersData,
    selectPreparedTopicStats,
    getTopic,
    setDataWasNotLoaded,
} from '../../../../store/reducers/topic';

import {isCdcStreamEntityType} from '../../utils/schema';

import {ConsumersTopicStats} from './TopicStats';
import {columns} from './columns';

import i18n from './i18n';

import './Consumers.scss';

const b = block('ydb-diagnostics-consumers');

interface ConsumersProps {
    path: string;
    type?: EPathType;
}

export const Consumers = ({path, type}: ConsumersProps) => {
    const isCdcStream = isCdcStreamEntityType(type);

    const dispatch = useDispatch();

    const [searchValue, setSearchValue] = useState('');

    const {autorefresh} = useTypedSelector((state) => state.schema);
    const {loading, wasLoaded, error} = useTypedSelector((state) => state.topic);

    const consumers = useTypedSelector((state) => selectPreparedConsumersData(state));
    const topic = useTypedSelector((state) => selectPreparedTopicStats(state));

    const fetchData = useCallback(
        (isBackground) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded);
            }

            dispatch(getTopic(path));
        },
        [dispatch, path],
    );

    useAutofetcher(fetchData, [fetchData], autorefresh);

    const dataToRender = useMemo(() => {
        if (!consumers) {
            return [];
        }

        const searchRe = new RegExp(escapeRegExp(searchValue), 'i');

        return consumers.filter((consumer) => {
            return searchRe.test(String(consumer.name));
        });
    }, [consumers, searchValue]);

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
    };

    if (loading && !wasLoaded) {
        return <Loader size="m" />;
    }

    if (error) {
        return <ResponseError error={error} />;
    }

    if (!consumers || !consumers.length) {
        return <div>{i18n(`noConsumersMessage.${isCdcStream ? 'stream' : 'topic'}`)}</div>;
    }

    return (
        <div className={b()}>
            <div className={b('controls')}>
                <Search
                    onChange={handleSearchChange}
                    placeholder={i18n('controls.search')}
                    className={b('search')}
                    value={searchValue}
                />
                {topic && <ConsumersTopicStats data={topic} />}
            </div>
            <div className={b('table-wrapper')}>
                <div className={b('table-content')}>
                    <DataTable
                        theme="yandex-cloud"
                        data={dataToRender}
                        columns={columns}
                        settings={DEFAULT_TABLE_SETTINGS}
                        emptyDataMessage={i18n('table.emptyDataMessage')}
                    />
                </div>
            </div>
        </div>
    );
};
