import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import {nodesListApi, selectNodesMap} from '../../../../store/reducers/nodesList';
import {partitionsApi, setSelectedConsumer} from '../../../../store/reducers/partitions/partitions';
import {selectConsumersNames, topicApi} from '../../../../store/reducers/topic';
import {cn} from '../../../../utils/cn';
import {DEFAULT_TABLE_SETTINGS, PARTITIONS_HIDDEN_COLUMNS_KEY} from '../../../../utils/constants';
import {
    useAutoRefreshInterval,
    useSetting,
    useTypedDispatch,
    useTypedSelector,
} from '../../../../utils/hooks';

import {PartitionsControls} from './PartitionsControls/PartitionsControls';
import {PARTITIONS_COLUMNS_WIDTH_LS_KEY} from './columns';
import i18n from './i18n';
import {addHostToPartitions} from './utils';
import type {PreparedPartitionDataWithHosts} from './utils/types';
import {useGetPartitionsColumns} from './utils/useGetPartitionsColumns';

import './Partitions.scss';

export const b = cn('ydb-diagnostics-partitions');

interface PartitionsProps {
    path?: string;
}

export const Partitions = ({path}: PartitionsProps) => {
    const dispatch = useTypedDispatch();

    const [partitionsToRender, setPartitionsToRender] = React.useState<
        PreparedPartitionDataWithHosts[]
    >([]);

    const consumers = useTypedSelector((state) => selectConsumersNames(state, path));
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {selectedConsumer} = useTypedSelector((state) => state.partitions);
    const {
        currentData: topicData,
        isFetching: topicIsFetching,
        error: topicError,
    } = topicApi.useGetTopicQuery({path});
    const topicLoading = topicIsFetching && topicData === undefined;
    const {
        currentData: nodesData,
        isFetching: nodesIsFetching,
        error: nodesError,
    } = nodesListApi.useGetNodesListQuery(undefined);
    const nodesLoading = nodesIsFetching && nodesData === undefined;
    const nodesMap = useTypedSelector(selectNodesMap);

    const [hiddenColumns, setHiddenColumns] = useSetting<string[]>(PARTITIONS_HIDDEN_COLUMNS_KEY);

    const [columns, columnsIdsForSelector] = useGetPartitionsColumns(selectedConsumer);

    const params = !topicLoading && path ? {path, consumerName: selectedConsumer} : skipToken;
    const {
        currentData: partitionsData,
        isFetching: partitionsIsFetching,
        error: partitionsError,
    } = partitionsApi.useGetPartitionsQuery(params, {pollingInterval: autoRefreshInterval});
    const partitionsLoading = partitionsIsFetching && partitionsData === undefined;
    const rawPartitions = partitionsData;

    const partitionsWithHosts = React.useMemo(() => {
        return addHostToPartitions(rawPartitions, nodesMap);
    }, [rawPartitions, nodesMap]);

    // Wrong consumer could be passed in search query
    // Reset consumer if it doesn't exist for current topic
    React.useEffect(() => {
        const isTopicWithoutConsumers = !topicLoading && !consumers;
        const wrongSelectedConsumer =
            selectedConsumer && consumers && !consumers.includes(selectedConsumer);

        if (isTopicWithoutConsumers || wrongSelectedConsumer) {
            dispatch(setSelectedConsumer(''));
        }
    }, [dispatch, topicLoading, selectedConsumer, consumers]);

    const columnsToShow = React.useMemo(() => {
        return columns.filter((column) => !hiddenColumns.includes(column.name));
    }, [columns, hiddenColumns]);

    const hadleTableColumnsSetupChange = (newHiddenColumns: string[]) => {
        setHiddenColumns(newHiddenColumns);
    };

    const handleSelectedConsumerChange = (value: string) => {
        dispatch(setSelectedConsumer(value));
    };

    const loading = topicLoading || nodesLoading || partitionsLoading;

    const error = nodesError || topicError || partitionsError;

    const renderControls = () => {
        return (
            <PartitionsControls
                consumers={consumers}
                selectedConsumer={selectedConsumer}
                onSelectedConsumerChange={handleSelectedConsumerChange}
                selectDisabled={Boolean(error) || loading}
                partitions={partitionsWithHosts}
                onSearchChange={setPartitionsToRender}
                hiddenColumns={hiddenColumns}
                onHiddenColumnsChange={hadleTableColumnsSetupChange}
                initialColumnsIds={columnsIdsForSelector}
            />
        );
    };

    const renderContent = () => {
        if (loading) {
            return <TableSkeleton className={b('loader')} />;
        }
        if (error) {
            return <ResponseError error={error} />;
        }

        return (
            <ResizeableDataTable
                columnsWidthLSKey={PARTITIONS_COLUMNS_WIDTH_LS_KEY}
                wrapperClassName={b('table')}
                data={partitionsToRender}
                columns={columnsToShow}
                settings={DEFAULT_TABLE_SETTINGS}
                emptyDataMessage={i18n('table.emptyDataMessage')}
            />
        );
    };

    return (
        <div className={b()}>
            <div className={b('controls')}>{renderControls()}</div>
            <div className={b('table-wrapper')}>
                <div className={b('table-content')}>{renderContent()}</div>
            </div>
        </div>
    );
};
