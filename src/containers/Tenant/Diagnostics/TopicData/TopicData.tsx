import React from 'react';

import {Pagination} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {DrawerWrapper} from '../../../../components/Drawer';
import {EmptyFilter} from '../../../../components/EmptyFilter/EmptyFilter';
import {EnableFullscreenButton} from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import {Fullscreen} from '../../../../components/Fullscreen/Fullscreen';
import {
    DEFAULT_TABLE_ROW_HEIGHT,
    PAGINATED_TABLE_IDS,
    ResizeablePaginatedTable,
} from '../../../../components/PaginatedTable';
import {PaginatedTableWithLayout} from '../../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../../components/TableColumnSetup/TableColumnSetup';
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
import {useTopicPagination} from './useTopicPagination';
import {useTopicPartitions} from './useTopicPartitions';
import {useTopicProbeQuery} from './useTopicProbeQuery';
import {useTopicScroll} from './useTopicScroll';
import {
    TOPIC_DATA_COLUMNS_TITLES,
    TOPIC_DATA_COLUMNS_WIDTH_LS_KEY,
    TOPIC_DATA_DEFAULT_PAGE_SIZE,
    TOPIC_DATA_FETCH_LIMIT,
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

    const [controlsKey, setControlsKey] = React.useState(0);
    const [startOffset, setStartOffset] = React.useState<number>();

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

    // Clean up topic-specific URL params on unmount
    React.useEffect(() => {
        return () => {
            handleSelectedPartitionChange(undefined);
            handleSelectedOffsetChange(undefined);
            handleStartTimestampChange(undefined);
        };
    }, [handleSelectedPartitionChange, handleSelectedOffsetChange, handleStartTimestampChange]);

    const {partitions, partitionsLoading, partitionsError, baseOffset, endOffset, setEndOffset} =
        useTopicPartitions({
            path,
            database,
            databaseFullPath,
            selectedPartition,
            onPartitionAutoSelect: handleSelectedPartitionChange,
        });

    const {
        currentPage,
        setCurrentPage,
        totalOffsets,
        usePagination,
        pageStartOffset,
        pageEntitiesCount,
    } = useTopicPagination({baseOffset, endOffset});

    const setBoundOffsets = React.useCallback(
        ({
            startOffset: newStartOffset,
            endOffset: newEndOffset,
        }: {
            startOffset: number;
            endOffset: number;
        }) => {
            setStartOffset(newStartOffset);
            setEndOffset(newEndOffset);
        },
        [setEndOffset],
    );

    const {error, isFetching, emptyData, currentData} = useTopicProbeQuery({
        path,
        database,
        selectedPartition,
        selectedOffset,
        startTimestamp,
        setBoundOffsets,
    });

    const {scrollToOffset} = useTopicScroll({
        scrollContainerRef,
        baseOffset,
        endOffset,
        pageStartOffset,
        usePagination,
        currentPage,
        setCurrentPage,
        selectedPartition,
        selectedOffset,
        startTimestamp,
        activeOffset,
        currentData,
        isFetching,
    });

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        columns,
        TOPIC_DATA_SELECTED_COLUMNS_LS_KEY,
        TOPIC_DATA_COLUMNS_TITLES,
        DEFAULT_TOPIC_DATA_COLUMNS,
        REQUIRED_TOPIC_DATA_COLUMNS,
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
        [handleSelectedPartitionChange, resetFilters, setCurrentPage],
    );

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

    const handlePaginationUpdate = React.useCallback(
        (page: number) => {
            setCurrentPage(page);
        },
        [setCurrentPage],
    );

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
