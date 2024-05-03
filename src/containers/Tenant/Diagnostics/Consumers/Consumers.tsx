import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import escapeRegExp from 'lodash/escapeRegExp';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {Loader} from '../../../../components/Loader';
import {Search} from '../../../../components/Search';
import {
    selectPreparedConsumersData,
    selectPreparedTopicStats,
    topicApi,
} from '../../../../store/reducers/topic';
import type {EPathType} from '../../../../types/api/schema';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useTypedSelector} from '../../../../utils/hooks';
import {isCdcStreamEntityType} from '../../utils/schema';

import {ConsumersTopicStats} from './TopicStats';
import {columns} from './columns';
import i18n from './i18n';

import './Consumers.scss';

const b = cn('ydb-diagnostics-consumers');

interface ConsumersProps {
    path: string;
    type?: EPathType;
}

export const Consumers = ({path, type}: ConsumersProps) => {
    const isCdcStream = isCdcStreamEntityType(type);

    const [searchValue, setSearchValue] = React.useState('');

    const {autorefresh} = useTypedSelector((state) => state.schema);
    const {currentData, isFetching, error} = topicApi.useGetTopicQuery(
        {path},
        {pollingInterval: autorefresh},
    );
    const loading = isFetching && currentData === undefined;
    const consumers = useTypedSelector((state) => selectPreparedConsumersData(state, path));
    const topic = useTypedSelector((state) => selectPreparedTopicStats(state, path));

    const dataToRender = React.useMemo(() => {
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

    if (loading) {
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
