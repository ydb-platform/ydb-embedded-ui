import React from 'react';

import {NoSearchResults} from '@gravity-ui/illustrations';

import type {RenderControls} from '../../../../components/PaginatedTable';
import {ResizeablePaginatedTable} from '../../../../components/PaginatedTable';
import {partitionsApi} from '../../../../store/reducers/partitions/partitions';
import type {TopicMessageMetadataItem} from '../../../../types/api/topic';
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
    const [startOffset, setStartOffset] = React.useState<number | undefined>(undefined);
    const [endOffset, setEndOffset] = React.useState<number | undefined>(undefined);
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
    } = useTopicDataQueryParams();

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

    const tableFilters = React.useMemo(() => {
        return {
            path,
            database,
            partition: selectedPartition ?? '',
            selectedOffset: safeParseNumber(selectedOffset),
            startTimestamp: safeParseNumber(startTimestamp),
            topicDataFilter,
        };
    }, [path, database, selectedPartition, selectedOffset, startTimestamp, topicDataFilter]);

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        getAllColumns(setFullValue),
        TOPIC_DATA_SELECTED_COLUMNS_LS_KEY,
        TOPIC_DATA_COLUMNS_TITLES,
        DEFAULT_TOPIC_DATA_COLUMNS,
        REQUIRED_TOPIC_DATA_COLUMNS,
    );

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

    return (
        <React.Fragment>
            <FullValue value={fullValue} onClose={() => setFullValue(undefined)} />
            <ResizeablePaginatedTable
                columnsWidthLSKey={TOPIC_DATA_COLUMNS_WIDTH_LS_KEY}
                parentRef={parentRef}
                columns={columnsToShow}
                fetchData={generateTopicDataGetter({
                    setStartOffset,
                    setEndOffset,
                    initialOffset: startOffset,
                })}
                limit={50}
                renderControls={renderControls}
                renderErrorMessage={renderPaginatedTableErrorMessage}
                renderEmptyDataMessage={renderEmptyDataMessage}
                filters={tableFilters}
                tableName="topicData"
            />
        </React.Fragment>
    );
}
