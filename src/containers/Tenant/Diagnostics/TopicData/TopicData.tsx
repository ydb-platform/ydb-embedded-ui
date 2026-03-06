import React from 'react';

import {NoSearchResults} from '@gravity-ui/illustrations';
import {Pagination} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import {DrawerWrapper} from '../../../../components/Drawer';
import {EmptyFilter} from '../../../../components/EmptyFilter/EmptyFilter';
import {EnableFullscreenButton} from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import {PageError} from '../../../../components/Errors/PageError/PageError';
import {Fullscreen} from '../../../../components/Fullscreen/Fullscreen';
import {
    DEFAULT_TABLE_ROW_HEIGHT,
    PAGINATED_TABLE_IDS,
    ResizeablePaginatedTable,
} from '../../../../components/PaginatedTable';
import {PaginatedTableWithLayout} from '../../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../../components/TableColumnSetup/TableColumnSetup';
import {useClusterWithProxy} from '../../../../store/reducers/cluster/cluster';
import {partitionsApi} from '../../../../store/reducers/partitions/partitions';
import {topicApi} from '../../../../store/reducers/topic';
import type {TopicDataRequest} from '../../../../types/api/topic';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import {getIllustration} from '../../../../utils/illustrations';
import {renderPaginatedTableErrorMessage} from '../../../../utils/renderPaginatedTableErrorMessage';
import {safeParseNumber} from '../../../../utils/utils';

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
    TOPIC_DATA_DEFAULT_PAGE_SIZE,
    TOPIC_DATA_FETCH_LIMIT,
    TOPIC_DATA_MIN_TOTAL_FOR_PAGINATION,
    TOPIC_DATA_SELECTED_COLUMNS_LS_KEY,
    b,
} from './utils/constants';

import './TopicData.scss';

interface TopicDataProps {
    path: string;
    database: string;
    databaseFullPath: string;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const columns = getAllColumns();

export function TopicData({scrollContainerRef, path, database, databaseFullPath}: TopicDataProps) {
    const NoSearchResultsImage = getIllustration('NoSearchResults');

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const useMetaProxy = useClusterWithProxy();
    const [startOffset, setStartOffset] = React.useState<number>();
    const [endOffset, setEndOffset] = React.useState<number>();
    const [controlsKey, setControlsKey] = React.useState(0);
    const [emptyData, setEmptyData] = React.useState(false);

    const [baseOffset, setBaseOffset] = React.useState<number>();

    // Pagination state (1-based, matching Gravity UI Pagination)
    const [currentPage, setCurrentPage] = React.useState(1);

    // Ref to store pending scroll target after page change
    const pendingScrollOffset = React.useRef<number | undefined>();

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

    // Scroll to top synchronously before paint when page or partition changes
    const prevPage = React.useRef(currentPage);
    const prevPartition = React.useRef(selectedPartition);
    React.useLayoutEffect(() => {
        const pageChanged = prevPage.current !== currentPage;
        const partitionChanged = prevPartition.current !== selectedPartition;
        if (pageChanged || partitionChanged) {
            prevPage.current = currentPage;
            prevPartition.current = selectedPartition;
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
            }
        }
    }, [currentPage, selectedPartition, scrollContainerRef]);

    React.useEffect(() => {
        return () => {
            handleSelectedPartitionChange(undefined);
            handleSelectedOffsetChange(undefined);
            handleStartTimestampChange(undefined);
        };
    }, [handleSelectedPartitionChange, handleSelectedOffsetChange, handleStartTimestampChange]);

    // Total number of offsets in the partition
    const totalOffsets = React.useMemo(() => {
        if (isNil(baseOffset) || isNil(endOffset)) {
            return 0;
        }
        return Math.max(endOffset - baseOffset, 0);
    }, [baseOffset, endOffset]);

    const usePagination = totalOffsets > TOPIC_DATA_MIN_TOTAL_FOR_PAGINATION;

    // Compute pageStartOffset for the current page
    // When pagination is active: baseOffset + (currentPage - 1) * TOPIC_DATA_DEFAULT_PAGE_SIZE
    // When pagination is not active: baseOffset (show all offsets)
    const pageStartOffset = React.useMemo(() => {
        if (isNil(baseOffset)) {
            return undefined;
        }
        if (!usePagination) {
            return baseOffset;
        }
        return baseOffset + (currentPage - 1) * TOPIC_DATA_DEFAULT_PAGE_SIZE;
    }, [baseOffset, usePagination, currentPage]);

    const queryParams = React.useMemo(() => {
        if (isNil(selectedPartition)) {
            return skipToken;
        }
        const params: TopicDataRequest = {database, path, partition: selectedPartition, limit: 1};
        if (startTimestamp) {
            params.read_timestamp = startTimestamp;
        } else if (isNil(selectedOffset)) {
            return skipToken;
        } else {
            params.offset = Number(selectedOffset);
        }
        return params;
    }, [selectedPartition, selectedOffset, startTimestamp, database, path]);

    const {currentData, error, isFetching} = topicApi.useGetTopicDataQuery(queryParams);

    const {
        data: partitions,
        isLoading: partitionsLoading,
        error: partitionsError,
    } = partitionsApi.useGetPartitionsQuery(
        {path, database, databaseFullPath, useMetaProxy},
        {pollingInterval: autoRefreshInterval},
    );

    const prevSelectedPartition = React.useRef(selectedPartition);

    React.useEffect(() => {
        const selectedPartitionChanged = selectedPartition !== prevSelectedPartition.current;
        const selectedPartitionData = partitions?.find(
            ({partitionId}) => partitionId === selectedPartition,
        );
        if (selectedPartitionData) {
            if (isNil(endOffset) || selectedPartitionChanged) {
                setEndOffset(safeParseNumber(selectedPartitionData.endOffset));
            }
            if (isNil(baseOffset) || selectedPartitionChanged) {
                setBaseOffset(safeParseNumber(selectedPartitionData.startOffset));
            }
        }
        if (selectedPartitionChanged) {
            prevSelectedPartition.current = selectedPartition;
        }
    }, [selectedPartition, partitions, endOffset, baseOffset]);

    React.useEffect(() => {
        if (partitions && partitions.length && isNil(selectedPartition)) {
            const firstPartitionId = partitions[0].partitionId;
            handleSelectedPartitionChange(
                isNil(firstPartitionId) ? undefined : String(firstPartitionId),
            );
        }
    }, [partitions, selectedPartition, handleSelectedPartitionChange]);

    // Number of entities on the current page
    const pageEntitiesCount = React.useMemo(() => {
        if (isNil(pageStartOffset) || isNil(endOffset)) {
            return 0;
        }
        const remaining = endOffset - pageStartOffset;
        const result = usePagination
            ? Math.max(Math.min(TOPIC_DATA_DEFAULT_PAGE_SIZE, remaining), 0)
            : Math.max(remaining, 0);
        return result;
    }, [pageStartOffset, endOffset, usePagination]);

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
        const hasMessages = Boolean(currentData?.Messages?.length);
        setEmptyData(!hasMessages || Boolean(error));
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
            currentPage,
        }),
        [path, database, selectedPartition, emptyData, currentPage],
    );

    const resetFilters = React.useCallback(() => {
        handleSelectedOffsetChange(undefined);
        handleStartTimestampChange(undefined);
        if (topicDataFilter === 'TIMESTAMP') {
            setControlsKey((prev) => prev + 1);
        }
    }, [handleSelectedOffsetChange, handleStartTimestampChange, topicDataFilter]);

    const handlePartitionChange = React.useCallback(
        (value: string[]) => {
            handleSelectedPartitionChange(value[0]);
            resetFilters();
            setCurrentPage(1);
        },
        [handleSelectedPartitionChange, resetFilters],
    );

    const scrollToOffset = React.useCallback(
        (newOffset: number) => {
            if (isNil(baseOffset) || isNil(endOffset) || isNil(pageStartOffset)) {
                return;
            }

            // Guard: offset is out of partition range — nothing to navigate to
            if (newOffset < baseOffset || newOffset >= endOffset) {
                return;
            }

            if (usePagination) {
                // Calculate which page this offset belongs to (1-based)
                const absoluteRow = newOffset - baseOffset;
                const targetPage = Math.floor(absoluteRow / TOPIC_DATA_DEFAULT_PAGE_SIZE) + 1;

                if (targetPage !== currentPage) {
                    // Need to switch page first, then scroll after render
                    pendingScrollOffset.current = newOffset;
                    setCurrentPage(targetPage);
                    return;
                }
            }

            const scrollTop = (newOffset - pageStartOffset) * DEFAULT_TABLE_ROW_HEIGHT;
            const normalizedScrollTop = Math.max(0, scrollTop);
            scrollContainerRef.current?.scrollTo({
                top: normalizedScrollTop,
                behavior: 'instant',
            });
        },
        [pageStartOffset, baseOffset, endOffset, usePagination, currentPage, scrollContainerRef],
    );

    // Keep a ref to the latest scrollToOffset to avoid stale closure in useEffect
    const scrollToOffsetRef = React.useRef(scrollToOffset);
    React.useLayoutEffect(() => {
        scrollToOffsetRef.current = scrollToOffset;
    }, [scrollToOffset]);

    // Handle pending scroll after page change.
    // Uses scrollToOffsetRef to always call the latest version without adding scrollToOffset to deps.
    React.useEffect(() => {
        const pending = pendingScrollOffset.current;
        if (!isNil(pending)) {
            pendingScrollOffset.current = undefined;
            scrollToOffsetRef.current(pending);
        }
    }, [currentPage]);

    // On first open: scroll to the offset from URL (selectedOffset or activeOffset).
    // Consumed once and cleared so subsequent data loads don't re-trigger the scroll.
    const initialScrollToOffset = React.useRef(selectedOffset ?? activeOffset);

    // When selectedOffset changes, scroll to the first message returned by the API.
    const shouldScrollToFirstMessage = React.useRef(false);
    React.useEffect(() => {
        shouldScrollToFirstMessage.current = true;
    }, [selectedOffset]);

    React.useEffect(() => {
        if (isFetching || isNil(baseOffset) || isNil(endOffset)) {
            return;
        }

        // Case 1: first open — scroll to the initial offset from URL
        if (!isNil(initialScrollToOffset.current)) {
            const targetOffset = Number(initialScrollToOffset.current);
            initialScrollToOffset.current = undefined;
            shouldScrollToFirstMessage.current = false;
            scrollToOffsetRef.current(targetOffset);
            return;
        }

        // Case 2: selectedOffset changed — scroll to the first message from API response
        if (shouldScrollToFirstMessage.current) {
            shouldScrollToFirstMessage.current = false;
            const firstMessage = currentData?.Messages?.[0];
            if (!isNil(firstMessage)) {
                scrollToOffsetRef.current(safeParseNumber(firstMessage.Offset));
            }
        }
    }, [currentData, isFetching, baseOffset, endOffset]);

    const handlePaginationUpdate = React.useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const renderControls = React.useCallback(() => {
        return (
            <TopicDataControls
                // component has uncontrolled components inside, so it should be rerendered on filters reset
                key={controlsKey}
                handlePartitionChange={handlePartitionChange}
                partitions={partitions}
                partitionsLoading={partitionsLoading}
                partitionsError={partitionsError}
                startOffset={startOffset}
                endOffset={endOffset}
                scrollToOffset={scrollToOffset}
            />
        );
    }, [
        controlsKey,
        endOffset,
        partitions,
        partitionsError,
        partitionsLoading,
        scrollToOffset,
        startOffset,
        handlePartitionChange,
    ]);

    const renderExtraControls = React.useCallback(() => {
        return (
            <TableColumnSetup
                popupWidth={242}
                items={columnsToSelect}
                showStatus
                onUpdate={setColumns}
            />
        );
    }, [columnsToSelect, setColumns]);

    const renderEmptyDataMessage = () => {
        const hasFilters = selectedOffset || startTimestamp;

        return (
            <EmptyFilter
                title={i18n('label_nothing-found')}
                message={i18n('description_nothing-found')}
                onShowAll={hasFilters ? resetFilters : undefined}
                showAll={i18n('action_show-all')}
                image={<NoSearchResultsImage width={230} height={230} />}
            />
        );
    };

    const getTopicData = React.useMemo(
        () =>
            generateTopicDataGetter({
                setBoundOffsets,
                baseOffset: pageStartOffset,
                maxEntities: usePagination ? TOPIC_DATA_DEFAULT_PAGE_SIZE : undefined,
            }),
        [pageStartOffset, setBoundOffsets, usePagination],
    );

    const closeDrawer = React.useCallback(() => {
        handleActiveOffsetChange(undefined);
    }, [handleActiveOffsetChange]);

    const renderDrawerContent = React.useCallback(() => {
        return (
            <Fullscreen>
                <TopicMessageDetails
                    database={database}
                    path={path}
                    scrollContainerRef={scrollContainerRef}
                />
            </Fullscreen>
        );
    }, [database, path, scrollContainerRef]);

    if (error) {
        return <PageError error={error} position="left" />;
    }

    return (
        !isNil(baseOffset) &&
        !isNil(endOffset) && (
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
                    extraControls={renderExtraControls()}
                    table={
                        <ResizeablePaginatedTable
                            fetchOverscan={1}
                            columnsWidthLSKey={TOPIC_DATA_COLUMNS_WIDTH_LS_KEY}
                            scrollContainerRef={scrollContainerRef}
                            columns={columnsToShow}
                            fetchData={getTopicData}
                            initialEntitiesCount={pageEntitiesCount}
                            limit={TOPIC_DATA_FETCH_LIMIT}
                            renderErrorMessage={renderPaginatedTableErrorMessage}
                            renderEmptyDataMessage={renderEmptyDataMessage}
                            filters={tableFilters}
                            tableName={PAGINATED_TABLE_IDS.TOPIC_DATA}
                            rowHeight={DEFAULT_TABLE_ROW_HEIGHT}
                            keepCache={false}
                            getRowClassName={(row) => {
                                return b('row', {
                                    active: Boolean(
                                        safeParseNumber(row.Offset) === selectedOffset ||
                                            String(row.Offset) === activeOffset,
                                    ),
                                    removed: row.removed,
                                });
                            }}
                        />
                    }
                    tableWrapperProps={{
                        scrollContainerRef,
                        scrollDependencies: [selectedPartition, pageStartOffset, tableFilters],
                    }}
                    footer={
                        usePagination ? (
                            <Pagination
                                page={currentPage}
                                pageSize={TOPIC_DATA_DEFAULT_PAGE_SIZE}
                                total={totalOffsets}
                                onUpdate={handlePaginationUpdate}
                                compact={false}
                                showInput
                            />
                        ) : undefined
                    }
                    noBatching
                />
            </DrawerWrapper>
        )
    );
}
