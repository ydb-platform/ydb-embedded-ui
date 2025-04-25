import React from 'react';

import {NoSearchResults} from '@gravity-ui/illustrations';
import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import type {RenderControls} from '../../../../components/PaginatedTable';
import {
    DEFAULT_TABLE_ROW_HEIGHT,
    ResizeablePaginatedTable,
} from '../../../../components/PaginatedTable';
import {partitionsApi} from '../../../../store/reducers/partitions/partitions';
import {topicApi} from '../../../../store/reducers/topic';
import type {TopicDataRequest, TopicMessageMetadataItem} from '../../../../types/api/topic';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import {renderPaginatedTableErrorMessage} from '../../../../utils/renderPaginatedTableErrorMessage';
import {safeParseNumber} from '../../../../utils/utils';
import {EmptyFilter} from '../../../Storage/EmptyFilter/EmptyFilter';

import {FullValue} from './FullValue';
import {TopicDataControls} from './TopicDataControls/TopicDataControls';
import {
    DEFAULT_TOPIC_DATA_COLUMNS,
    REQUIRED_TOPIC_DATA_COLUMNS,
    getAllColumns,
} from './columns/columns';
import {generateTopicDataGetter} from './getData';
import i18n from './i18n';
import {useTopicDataQueryParams} from './useTopicDataQueryParams';
import {
    TOPIC_DATA_COLUMNS_TITLES,
    TOPIC_DATA_COLUMNS_WIDTH_LS_KEY,
    TOPIC_DATA_FETCH_LIMIT,
    TOPIC_DATA_SELECTED_COLUMNS_LS_KEY,
} from './utils/constants';

import './TopicData.scss';

interface TopicDataProps {
    path: string;
    database: string;
    parentRef: React.RefObject<HTMLElement>;
}

export function TopicData({parentRef, path, database}: TopicDataProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [startOffset, setStartOffset] = React.useState<number>();
    const [endOffset, setEndOffset] = React.useState<number>();
    const [fullValue, setFullValue] = React.useState<
        string | TopicMessageMetadataItem[] | undefined
    >(undefined);
    const [controlsKey, setControlsKey] = React.useState(0);
    const [emptyData, setEmptyData] = React.useState(false);

    const [baseOffset, setBaseOffset] = React.useState<number>(0);
    const [baseEndOffset, setBaseEndOffset] = React.useState<number>(0);

    const startRef = React.useRef<number>();
    startRef.current = startOffset;

    const {
        selectedPartition,
        selectedOffset,
        startTimestamp,
        topicDataFilter,
        handleSelectedOffsetChange,
        handleStartTimestampChange,
        handleSelectedPartitionChange,
    } = useTopicDataQueryParams();

    React.useEffect(() => {
        return () => {
            handleSelectedPartitionChange(undefined);
            handleSelectedOffsetChange(undefined);
            handleStartTimestampChange(undefined);
        };
    }, [handleSelectedPartitionChange, handleSelectedOffsetChange, handleStartTimestampChange]);

    const queryParams = React.useMemo(() => {
        if (isNil(selectedPartition)) {
            return skipToken;
        }
        const params: TopicDataRequest = {database, path, partition: selectedPartition, limit: 1};
        if (startTimestamp) {
            params.read_timestamp = startTimestamp;
        } else {
            params.offset = safeParseNumber(selectedOffset);
        }
        return params;
    }, [selectedPartition, selectedOffset, startTimestamp, database, path]);

    const {currentData, error, isFetching} = topicApi.useGetTopicDataQuery(queryParams);

    const {
        data: partitions,
        isLoading: partitionsLoading,
        error: partitionsError,
    } = partitionsApi.useGetPartitionsQuery(
        {path, database},
        {pollingInterval: autoRefreshInterval},
    );

    React.useEffect(() => {
        const selectedPartitionData = partitions?.find(
            ({partitionId}) => partitionId === selectedPartition,
        );
        if (selectedPartitionData) {
            if (!baseOffset) {
                setBaseOffset(safeParseNumber(selectedPartitionData.startOffset));
            }
            if (!baseEndOffset) {
                setBaseEndOffset(safeParseNumber(selectedPartitionData.endOffset));
            }
        }
    }, [selectedPartition, partitions, baseOffset, baseEndOffset, startOffset, endOffset]);

    React.useEffect(() => {
        if (partitions && partitions.length && isNil(selectedPartition)) {
            handleSelectedPartitionChange(partitions[0].partitionId);
        }
    }, [partitions, selectedPartition, handleSelectedPartitionChange]);

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        getAllColumns(setFullValue),
        TOPIC_DATA_SELECTED_COLUMNS_LS_KEY,
        TOPIC_DATA_COLUMNS_TITLES,
        DEFAULT_TOPIC_DATA_COLUMNS,
        REQUIRED_TOPIC_DATA_COLUMNS,
    );

    React.useEffect(() => {
        //values should be recalculated only when data is fetched
        if (isFetching || (!currentData && !error)) {
            return;
        }
        if (currentData?.Messages?.length || (!currentData && !error)) {
            setEmptyData(false);
        } else if (!(currentData && currentData.Messages?.length) || error) {
            setEmptyData(true);
        }
        if (currentData) {
            setStartOffset(safeParseNumber(currentData.StartOffset));
            setEndOffset(safeParseNumber(currentData.EndOffset));
        }
    }, [isFetching, currentData, error]);

    const tableFilters = React.useMemo(
        () => ({
            path,
            database,
            partition: selectedPartition ?? '',
            isEmpty: emptyData,
        }),
        [path, database, selectedPartition, emptyData],
    );

    const scrollToOffset = React.useCallback(
        (newOffset: number) => {
            const scrollTop = (newOffset - (baseOffset ?? 0)) * DEFAULT_TABLE_ROW_HEIGHT;
            const normalizedScrollTop = Math.max(0, scrollTop);
            parentRef.current?.scrollTo({
                top: normalizedScrollTop,
                behavior: 'instant',
            });
        },
        [baseOffset, parentRef],
    );

    React.useEffect(() => {
        if (isFetching) {
            return;
        }
        const messages = currentData?.Messages;
        if (messages?.length) {
            const messageOffset = safeParseNumber(messages[0].Offset);
            //scroll when table is already rendered and calculated it's state
            setTimeout(() => {
                scrollToOffset(messageOffset);
            }, 0);
        }
    }, [currentData, isFetching, scrollToOffset]);

    const scrollToStartOffset = React.useCallback(() => {
        if (startOffset) {
            scrollToOffset(startOffset);
        }
    }, [startOffset, scrollToOffset]);

    const scrollToEndOffset = React.useCallback(() => {
        if (endOffset) {
            scrollToOffset(endOffset);
        }
    }, [endOffset, scrollToOffset]);

    const renderControls: RenderControls = () => {
        return (
            <TopicDataControls
                // component has uncontrolled components inside, so it should be rerendered on filters reset
                key={controlsKey}
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={setColumns}
                partitions={partitions}
                partitionsLoading={partitionsLoading}
                partitionsError={partitionsError}
                initialOffset={startOffset}
                endOffset={endOffset}
                scrollToStartOffset={scrollToStartOffset}
                scrollToEndOffset={scrollToEndOffset}
            />
        );
    };

    const renderEmptyDataMessage = () => {
        const hasFilters = selectedOffset || startTimestamp;

        const resetFilter = () => {
            if (topicDataFilter === 'OFFSET') {
                handleSelectedOffsetChange(undefined);
            } else if (topicDataFilter === 'TIMESTAMP') {
                handleStartTimestampChange(undefined);
                setControlsKey((prev) => prev + 1);
            }
        };

        return (
            <EmptyFilter
                title={i18n('label_nothing-found')}
                message={i18n('description_nothing-found')}
                onShowAll={hasFilters ? resetFilter : undefined}
                showAll={i18n('action_show-all')}
                image={<NoSearchResults width={230} height={230} />}
            />
        );
    };

    const getTopicData = React.useMemo(
        () => generateTopicDataGetter({setEndOffset, setStartOffset, baseOffset}),
        [baseOffset],
    );

    return (
        <React.Fragment>
            <FullValue value={fullValue} onClose={() => setFullValue(undefined)} />
            <ResizeablePaginatedTable
                columnsWidthLSKey={TOPIC_DATA_COLUMNS_WIDTH_LS_KEY}
                parentRef={parentRef}
                columns={columnsToShow}
                fetchData={getTopicData}
                initialEntitiesCount={baseEndOffset - baseOffset}
                limit={TOPIC_DATA_FETCH_LIMIT}
                renderControls={renderControls}
                renderErrorMessage={renderPaginatedTableErrorMessage}
                renderEmptyDataMessage={renderEmptyDataMessage}
                filters={tableFilters}
                tableName="topicData"
                rowHeight={DEFAULT_TABLE_ROW_HEIGHT}
            />
        </React.Fragment>
    );
}
