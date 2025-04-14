import React from 'react';

import type {Value} from '@gravity-ui/date-components';
import {RelativeDatePicker} from '@gravity-ui/date-components';
import {dateTimeParse} from '@gravity-ui/date-utils';
import type {TableColumnSetupItem} from '@gravity-ui/uikit';
import {RadioButton, Select, TableColumnSetup} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {DebouncedInput} from '../../../../../components/DebouncedInput/DebouncedInput';
import {EntitiesCount} from '../../../../../components/EntitiesCount';
import type {PreparedPartitionData} from '../../../../../store/reducers/partitions/types';
import {formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import {prepareErrorMessage} from '../../../../../utils/prepareErrorMessage';
import {convertToNumber} from '../../../../../utils/utils';
import i18n from '../i18n';
import {useTopicDataQueryParams} from '../useTopicDataQueryParams';
import {b} from '../utils/constants';
import {TopicDataFilterValues} from '../utils/types';
import type {TopicDataFilterValue} from '../utils/types';

interface TopicDataControlsProps {
    columnsToSelect: TableColumnSetupItem[];
    handleSelectedColumnsUpdate: (updated: TableColumnSetupItem[]) => void;

    partitions?: PreparedPartitionData[];
    partitionsLoading: boolean;
    partitionsError: unknown;

    initialOffset?: number;
    endOffset?: number;
}

export function TopicDataControls({
    columnsToSelect,
    handleSelectedColumnsUpdate,

    initialOffset = 0,
    endOffset = 0,
    partitions,
    partitionsLoading,
    partitionsError,
}: TopicDataControlsProps) {
    const {selectedPartition, handleSelectedPartitionChange: handleSelectedPartitionParamChange} =
        useTopicDataQueryParams();

    const partitionsToSelect = partitions?.map(({partitionId}) => ({
        content: partitionId,
        value: partitionId,
    }));

    const handleSelectedPartitionChange = React.useCallback(
        (value: string[]) => {
            handleSelectedPartitionParamChange(value[0]);
        },
        [handleSelectedPartitionParamChange],
    );

    React.useEffect(() => {
        if (partitions && partitions.length && isNil(selectedPartition)) {
            handleSelectedPartitionChange([partitions[0].partitionId]);
        }
    }, [partitions, selectedPartition, handleSelectedPartitionChange]);

    return (
        <React.Fragment>
            <Select
                className={b('partition-select')}
                label={i18n('label_partition-id')}
                options={partitionsToSelect}
                value={selectedPartition ? [selectedPartition] : undefined}
                onUpdate={handleSelectedPartitionChange}
                filterable={partitions && partitions.length > 5}
                disabled={!partitions || !partitions.length}
                errorPlacement="inside"
                errorMessage={prepareErrorMessage(partitionsError)}
                error={Boolean(partitionsError)}
                loading={partitionsLoading}
            />
            <TopicDataStartControls />
            <TableColumnSetup
                popupWidth={242}
                items={columnsToSelect}
                showStatus
                onUpdate={handleSelectedColumnsUpdate}
                sortable={false}
            />
            <EntitiesCount
                label={i18n('label_offset')}
                current={`${formatNumber(initialOffset)}—${formatNumber(endOffset)}`}
            />
        </React.Fragment>
    );
}

function TopicDataStartControls() {
    const {
        selectedOffset,
        startTimestamp,
        topicDataFilter,
        handleSelectedOffsetChange,
        handleStartTimestampChange,
        handleTopicDataFilterChange,
    } = useTopicDataQueryParams();

    const onFilterChange = React.useCallback(
        (value: TopicDataFilterValue) => {
            handleTopicDataFilterChange(value);
        },
        [handleTopicDataFilterChange],
    );
    const onStartOffsetChange = React.useCallback(
        (value: string) => {
            handleSelectedOffsetChange(convertToNumber(value));
        },
        [handleSelectedOffsetChange],
    );
    const handleFromTimestampChange = React.useCallback(
        (data: Value | null) => {
            let newValue: number | undefined;
            if (data) {
                const {value, type} = data;

                if (type === 'absolute') {
                    newValue = value.valueOf();
                } else if (type === 'relative') {
                    const absoluteValue = dateTimeParse(value);
                    newValue = absoluteValue ? absoluteValue.valueOf() : undefined;
                }
            }
            handleStartTimestampChange(newValue);
        },
        [handleStartTimestampChange],
    );

    const startDateTime = dateTimeParse(Number(startTimestamp));

    return (
        <React.Fragment>
            <RadioButton<TopicDataFilterValue> value={topicDataFilter} onUpdate={onFilterChange}>
                <RadioButton.Option value="TIMESTAMP">
                    {TopicDataFilterValues.TIMESTAMP}
                </RadioButton.Option>
                <RadioButton.Option value="OFFSET">
                    {TopicDataFilterValues.OFFSET}
                </RadioButton.Option>
            </RadioButton>
            {topicDataFilter === 'OFFSET' && (
                <DebouncedInput
                    value={selectedOffset ? String(selectedOffset) : ''}
                    onUpdate={onStartOffsetChange}
                    label={i18n('label_from')}
                    placeholder={i18n('label_offset')}
                    type="number"
                    debounce={600}
                    autoFocus
                />
            )}
            {topicDataFilter === 'TIMESTAMP' && (
                <RelativeDatePicker
                    format="YYYY-MM-DD HH:mm:ss"
                    hasClear
                    isDateUnavailable={(value) => value.isAfter(dateTimeParse())}
                    label={i18n('label_from')}
                    onUpdate={handleFromTimestampChange}
                    defaultValue={startDateTime ? {type: 'absolute', value: startDateTime} : null}
                    className={b('date-picker')}
                />
            )}
        </React.Fragment>
    );
}
