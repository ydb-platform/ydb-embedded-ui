import block from 'bem-cn-lite';
import {useCallback, useEffect, useMemo, useState} from 'react';

import DataTable from '@gravity-ui/react-data-table';

import {
    useAutofetcher,
    useTypedSelector,
    useTypedDispatch,
    useSetting,
} from '../../../../utils/hooks';
import {DEFAULT_TABLE_SETTINGS, PARTITIONS_HIDDEN_COLUMNS_KEY} from '../../../../utils/constants';

import {
    cleanTopicData,
    getTopic,
    selectConsumersNames,
    setDataWasNotLoaded as setTopicDataWasNotLoaded,
} from '../../../../store/reducers/topic';
import {
    getPartitions,
    setDataWasNotLoaded as setPartitionsDataWasNotLoaded,
    setSelectedConsumer,
} from '../../../../store/reducers/partitions/partitions';

import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import {ResponseError} from '../../../../components/Errors/ResponseError';
import {useClusterNodesMap} from '../../../../contexts/ClusterNodesMapContext/ClusterNodesMapContext';

import type {PreparedPartitionDataWithHosts} from './utils/types';
import {addHostToPartitions} from './utils';
import {PartitionsControls} from './PartitionsControls/PartitionsControls';
import {useGetPartitionsColumns} from './utils/useGetPartitionsColumns';

import i18n from './i18n';

import './Partitions.scss';

export const b = block('ydb-diagnostics-partitions');

interface PartitionsProps {
    path?: string;
}

export const Partitions = ({path}: PartitionsProps) => {
    const dispatch = useTypedDispatch();

    // Manual path control to ensure that topic state will be reset before data fetch
    // so no request with wrong params will be sent
    const [componentCurrentPath, setComponentCurrentPath] = useState(path);

    const [partitionsToRender, setPartitionsToRender] = useState<PreparedPartitionDataWithHosts[]>(
        [],
    );

    const nodesMap = useClusterNodesMap();

    const consumers = useTypedSelector(selectConsumersNames);
    const {autorefresh} = useTypedSelector((state) => state.schema);
    const {
        loading: partitionsLoading,
        wasLoaded: partitionsWasLoaded,
        error: partitionsError,
        partitions: rawPartitions,
        selectedConsumer,
    } = useTypedSelector((state) => state.partitions);
    const {
        loading: topicLoading,
        wasLoaded: topicWasLoaded,
        error: topicError,
    } = useTypedSelector((state) => state.topic);
    const {
        loading: nodesLoading,
        wasLoaded: nodesWasLoaded,
        error: nodesError,
    } = useTypedSelector((state) => state.nodesList);

    const [hiddenColumns, setHiddenColumns] = useSetting<string[]>(PARTITIONS_HIDDEN_COLUMNS_KEY);

    const [columns, columnsIdsForSelector] = useGetPartitionsColumns(selectedConsumer);

    useEffect(() => {
        dispatch(cleanTopicData());
        dispatch(setTopicDataWasNotLoaded());

        dispatch(getTopic(path));

        setComponentCurrentPath(path);
    }, [dispatch, path]);

    const partitionsWithHosts = useMemo(() => {
        return addHostToPartitions(rawPartitions, nodesMap);
    }, [rawPartitions, nodesMap]);

    const fetchData = useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setPartitionsDataWasNotLoaded());
            }
            if (topicWasLoaded && componentCurrentPath) {
                dispatch(getPartitions(componentCurrentPath, selectedConsumer));
            }
        },
        [dispatch, selectedConsumer, componentCurrentPath, topicWasLoaded],
    );

    useAutofetcher(fetchData, [fetchData], autorefresh);

    // Wrong consumer could be passed in search query
    // Reset consumer if it doesn't exist for current topic
    useEffect(() => {
        const isTopicWithoutConsumers = topicWasLoaded && !consumers;
        const wrongSelectedConsumer =
            selectedConsumer && consumers && !consumers.includes(selectedConsumer);

        if (isTopicWithoutConsumers || wrongSelectedConsumer) {
            dispatch(setSelectedConsumer(''));
        }
    }, [dispatch, topicWasLoaded, selectedConsumer, consumers]);

    const columnsToShow = useMemo(() => {
        return columns.filter((column) => !hiddenColumns.includes(column.name));
    }, [columns, hiddenColumns]);

    const hadleTableColumnsSetupChange = (newHiddenColumns: string[]) => {
        setHiddenColumns(newHiddenColumns);
    };

    const handleSelectedConsumerChange = (value: string) => {
        dispatch(setSelectedConsumer(value));
    };

    const loading =
        (topicLoading && !topicWasLoaded) ||
        (nodesLoading && !nodesWasLoaded) ||
        (partitionsLoading && !partitionsWasLoaded);

    const error = nodesError || topicError || partitionsError;

    const getContent = () => {
        if (loading) {
            return <TableSkeleton className={b('loader')} />;
        }
        if (error) {
            return <ResponseError error={error} />;
        }

        return (
            <DataTable
                theme="yandex-cloud"
                data={partitionsToRender}
                columns={columnsToShow}
                settings={DEFAULT_TABLE_SETTINGS}
                emptyDataMessage={i18n('table.emptyDataMessage')}
            />
        );
    };

    return (
        <div className={b()}>
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
            <div className={b('table-wrapper')}>
                <div className={b('table-content')}>{getContent()}</div>
            </div>
        </div>
    );
};
