import React from 'react';

import {NoSearchResults} from '@gravity-ui/illustrations';
import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import {DrawerWrapper} from '../../../../components/Drawer';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {
    DEFAULT_TABLE_ROW_HEIGHT,
    ResizeablePaginatedTable,
} from '../../../../components/PaginatedTable';
import {PaginatedTableWithLayout} from '../../../../components/PaginatedTable/PaginatedTableWithLayout';
import {partitionsApi} from '../../../../store/reducers/partitions/partitions';
import {topicApi} from '../../../../store/reducers/topic';
import type {TopicDataRequest} from '../../../../types/api/topic';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import {renderPaginatedTableErrorMessage} from '../../../../utils/renderPaginatedTableErrorMessage';
import {safeParseNumber} from '../../../../utils/utils';
import {EmptyFilter} from '../../../Storage/EmptyFilter/EmptyFilter';

import {TopicDataControls} from './TopicDataControls/TopicDataControls';
import {TopicMessageDetails} from './TopicMessageDetails/TopicMessageDetails';
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
    b,
} from './utils/constants';

import './TopicData.scss';

interface TopicDataProps {
    path: string;
    database: string;
    scrollContainerRef: React.RefObject<HTMLElement>;
}
const PAGINATED_TABLE_LIMIT = 50_000;

const columns = getAllColumns();

export function TopicData({scrollContainerRef, path, database}: TopicDataProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [startOffset, setStartOffset] = React.useState<number>();
    const [endOffset, setEndOffset] = React.useState<number>();
    const [controlsKey, setControlsKey] = React.useState(0);
    const [emptyData, setEmptyData] = React.useState(false);

    const [baseOffset, setBaseOffset] = React.useState<number>();
    const [truncated, setTruncated] = React.useState(false);
    const [baseEndOffset, setBaseEndOffset] = React.useState<number>();

    const startRef = React.useRef<number>();
    startRef.current = startOffset;

    const {
        selectedPartition,
        selectedOffset,
        startTimestamp,
        topicDataFilter,
        activeOffset,
        handleSelectedOffsetChange,
        handleStartTimestampChange,
        handleSelectedPartitionChange,
        handleActiveOffsetChange,
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
            let endOffset = baseEndOffset;
            if (!baseEndOffset) {
                endOffset = safeParseNumber(selectedPartitionData.endOffset);
                setBaseEndOffset(endOffset);
            }
            if (!baseOffset) {
                const partitionStartOffset = safeParseNumber(selectedPartitionData.startOffset);
                const newStartOffset = Math.max(
                    (endOffset ?? 0) - PAGINATED_TABLE_LIMIT,
                    partitionStartOffset,
                );

                setTruncated(newStartOffset !== partitionStartOffset);
                setBaseOffset(newStartOffset);
            }
        }
    }, [selectedPartition, partitions, baseOffset, baseEndOffset, startOffset, endOffset]);

    React.useEffect(() => {
        if (partitions && partitions.length && isNil(selectedPartition)) {
            const firstPartitionId = partitions[0].partitionId;
            handleSelectedPartitionChange(
                isNil(firstPartitionId) ? undefined : String(firstPartitionId),
            );
        }
    }, [partitions, selectedPartition, handleSelectedPartitionChange]);

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        columns,
        TOPIC_DATA_SELECTED_COLUMNS_LS_KEY,
        TOPIC_DATA_COLUMNS_TITLES,
        DEFAULT_TOPIC_DATA_COLUMNS,
        REQUIRED_TOPIC_DATA_COLUMNS,
    );

    const setBoundOffsets = React.useCallback(
        ({startOffset, endOffset}: {startOffset: number; endOffset: number}) => {
            setStartOffset(startOffset);
            setEndOffset(endOffset);
        },
        [],
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
            setBoundOffsets({
                startOffset: safeParseNumber(currentData.StartOffset),
                endOffset: safeParseNumber(currentData.EndOffset),
            });
        }
    }, [isFetching, currentData, error, setBoundOffsets]);

    const tableFilters = React.useMemo(
        () => ({
            path,
            database,
            partition: selectedPartition ?? '',
            isEmpty: emptyData,
        }),
        [path, database, selectedPartition, emptyData],
    );

    const resetFilters = React.useCallback(() => {
        handleSelectedOffsetChange(undefined);
        handleStartTimestampChange(undefined);
        if (topicDataFilter === 'TIMESTAMP') {
            setControlsKey((prev) => prev + 1);
        }
    }, [handleSelectedOffsetChange, handleStartTimestampChange, topicDataFilter]);

    const scrollToOffset = React.useCallback(
        (newOffset: number) => {
            const scrollTop = (newOffset - (baseOffset ?? 0)) * DEFAULT_TABLE_ROW_HEIGHT;
            const normalizedScrollTop = Math.max(0, scrollTop);
            scrollContainerRef.current?.scrollTo({
                top: normalizedScrollTop,
                behavior: 'instant',
            });
        },
        [baseOffset, scrollContainerRef],
    );

    //this variable is used to scroll to active offset the very first time on open page
    const initialActiveOffset = React.useRef(activeOffset);

    React.useEffect(() => {
        if (isFetching) {
            return;
        }

        let currentOffset: number | undefined;
        if (isNil(initialActiveOffset.current)) {
            const messages = currentData?.Messages;
            if (messages?.length) {
                currentOffset = safeParseNumber(messages[0].Offset);
            }
        } else {
            currentOffset = safeParseNumber(initialActiveOffset.current);
            initialActiveOffset.current = undefined;
        }
        if (!isNil(currentOffset)) {
            scrollToOffset(currentOffset);
        }
    }, [currentData, isFetching, scrollToOffset]);

    const renderControls = React.useCallback(() => {
        return (
            <TopicDataControls
                // component has uncontrolled components inside, so it should be rerendered on filters reset
                key={controlsKey}
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={setColumns}
                partitions={partitions}
                partitionsLoading={partitionsLoading}
                partitionsError={partitionsError}
                startOffset={startOffset}
                endOffset={endOffset}
                truncatedData={truncated}
                scrollToOffset={scrollToOffset}
            />
        );
    }, [
        columnsToSelect,
        controlsKey,
        endOffset,
        partitions,
        partitionsError,
        partitionsLoading,
        scrollToOffset,
        setColumns,
        startOffset,
        truncated,
    ]);

    const renderEmptyDataMessage = () => {
        const hasFilters = selectedOffset || startTimestamp;

        return (
            <EmptyFilter
                title={i18n('label_nothing-found')}
                message={i18n('description_nothing-found')}
                onShowAll={hasFilters ? resetFilters : undefined}
                showAll={i18n('action_show-all')}
                image={<NoSearchResults width={230} height={230} />}
            />
        );
    };

    const getTopicData = React.useMemo(
        () => generateTopicDataGetter({setBoundOffsets, baseOffset}),
        [baseOffset, setBoundOffsets],
    );

    const closeDrawer = React.useCallback(() => {
        handleActiveOffsetChange(undefined);
    }, [handleActiveOffsetChange]);

    const renderDrawerContent = React.useCallback(() => {
        return (
            <Fullscreen>
                <TopicMessageDetails database={database} path={path} />
            </Fullscreen>
        );
    }, [database, path]);

    return (
        !isNil(baseOffset) &&
        !isNil(baseEndOffset) && (
            <DrawerWrapper
                isDrawerVisible={!isNil(activeOffset)}
                onCloseDrawer={closeDrawer}
                renderDrawerContent={renderDrawerContent}
                drawerId="topic-data-details"
                storageKey="topic-data-details-drawer-width"
                detectClickOutside
                isPercentageWidth
                drawerControls={[
                    {type: 'copyLink', link: window.location.href},
                    {
                        type: 'custom',
                        node: <EnableFullscreenButton disabled={Boolean(error)} view="flat" />,
                        key: 'fullscreen',
                    },
                    {type: 'close'},
                ]}
                title={i18n('label_message')}
                headerClassName={b('drawer-header')}
            >
                <PaginatedTableWithLayout
                    controls={renderControls()}
                    table={
                        <ResizeablePaginatedTable
                            columnsWidthLSKey={TOPIC_DATA_COLUMNS_WIDTH_LS_KEY}
                            scrollContainerRef={scrollContainerRef}
                            columns={columnsToShow}
                            fetchData={getTopicData}
                            initialEntitiesCount={baseEndOffset - baseOffset}
                            limit={TOPIC_DATA_FETCH_LIMIT}
                            renderErrorMessage={renderPaginatedTableErrorMessage}
                            renderEmptyDataMessage={renderEmptyDataMessage}
                            filters={tableFilters}
                            tableName="topicData"
                            rowHeight={DEFAULT_TABLE_ROW_HEIGHT}
                            keepCache={false}
                            getRowClassName={(row) => {
                                return b('row', {
                                    active: Boolean(
                                        String(row.Offset) === selectedOffset ||
                                            String(row.Offset) === activeOffset,
                                    ),
                                    removed: row.removed,
                                });
                            }}
                        />
                    }
                    tableProps={{
                        scrollContainerRef,
                        scrollDependencies: [baseOffset, baseEndOffset, tableFilters],
                    }}
                    fullHeight
                />
            </DrawerWrapper>
        )
    );
}
