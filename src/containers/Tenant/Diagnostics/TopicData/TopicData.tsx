import React from 'react';

import {NoSearchResults} from '@gravity-ui/illustrations';
import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import type {RenderControls} from '../../../../components/PaginatedTable';
import {ResizeablePaginatedTable} from '../../../../components/PaginatedTable';
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
    const [startOffset, setStartOffset] = React.useState(0);
    const [endOffset, setEndOffset] = React.useState(0);
    const [fullValue, setFullValue] = React.useState<
        string | TopicMessageMetadataItem[] | undefined
    >(undefined);
    const [controlsKey, setControlsKey] = React.useState(0);

    const {
        selectedPartition,
        selectedOffset,
        startTimestamp,
        topicDataFilter,
        handleSelectedOffsetChange,
        handleStartTimestampChange,
        handleSelectedPartitionChange,
    } = useTopicDataQueryParams();

    const queryParams = React.useMemo(() => {
        if (isNil(selectedPartition)) {
            return skipToken;
        }
        const params: TopicDataRequest = {database, path, partition: selectedPartition, limit: 1};
        if (startTimestamp) {
            params.read_timestamp = startTimestamp;
        } else {
            params.offset = selectedOffset ?? 0;
        }
        return params;
    }, [selectedPartition, selectedOffset, startTimestamp, database, path]);

    const {currentData, isFetching} = topicApi.useGetTopicDataQuery(queryParams);

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
            setStartOffset(safeParseNumber(selectedPartitionData.startOffset));
            setEndOffset(safeParseNumber(selectedPartitionData.endOffset));
        }
    }, [selectedPartition, partitions]);

    React.useEffect(() => {
        if (partitions && partitions.length && isNil(selectedPartition)) {
            handleSelectedPartitionChange(partitions[0].partitionId);
            handleSelectedOffsetChange(undefined);
            handleStartTimestampChange(undefined);
        }
    }, [
        partitions,
        selectedPartition,
        handleSelectedPartitionChange,
        handleSelectedOffsetChange,
        handleStartTimestampChange,
    ]);

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        getAllColumns(setFullValue),
        TOPIC_DATA_SELECTED_COLUMNS_LS_KEY,
        TOPIC_DATA_COLUMNS_TITLES,
        DEFAULT_TOPIC_DATA_COLUMNS,
        REQUIRED_TOPIC_DATA_COLUMNS,
    );

    const emptyData = React.useMemo(() => !currentData?.Messages?.length, [currentData]);

    const tableFilters = React.useMemo(() => {
        return {
            path,
            database,
            partition: selectedPartition ?? '',
            isEmpty: emptyData,
        };
    }, [path, database, selectedPartition, emptyData]);

    const scrollToOffset = React.useCallback(
        (newOffset: number) => {
            const scrollTop = (newOffset - (startOffset ?? 0)) * 41;
            const normalizedScrollTop = Math.max(0, scrollTop);
            parentRef.current?.scrollTo({
                top: normalizedScrollTop,
                behavior: 'instant',
            });
        },
        [startOffset, parentRef],
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
        parentRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, [parentRef]);

    const scrollToEndOffset = React.useCallback(() => {
        if (parentRef.current) {
            parentRef.current.scrollTo({
                top: parentRef.current.scrollHeight - parentRef.current.clientHeight,
                behavior: 'smooth',
            });
        }
    }, [parentRef]);

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
        () => generateTopicDataGetter({setEndOffset, setStartOffset}),
        [],
    );

    return (
        <React.Fragment>
            <FullValue value={fullValue} onClose={() => setFullValue(undefined)} />
            <ResizeablePaginatedTable
                columnsWidthLSKey={TOPIC_DATA_COLUMNS_WIDTH_LS_KEY}
                parentRef={parentRef}
                columns={columnsToShow}
                fetchData={getTopicData}
                initialEntitiesCount={endOffset - startOffset}
                limit={50}
                startOffset={startOffset}
                renderControls={renderControls}
                renderErrorMessage={renderPaginatedTableErrorMessage}
                renderEmptyDataMessage={renderEmptyDataMessage}
                filters={tableFilters}
                tableName="topicData"
            />
        </React.Fragment>
    );
}
