import React from 'react';

import type {Value} from '@gravity-ui/date-components';
import {RelativeDatePicker} from '@gravity-ui/date-components';
import {dateTimeParse} from '@gravity-ui/date-utils';
import {ArrowDownToLine, ArrowUpToLine, CircleChevronDownFill} from '@gravity-ui/icons';
import type {TableColumnSetupItem} from '@gravity-ui/uikit';
import {
    ActionTooltip,
    Button,
    Flex,
    Icon,
    RadioButton,
    Select,
    TableColumnSetup,
} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {DebouncedInput} from '../../../../../components/DebouncedInput/DebouncedTextInput';
import {EntitiesCount} from '../../../../../components/EntitiesCount';
import type {PreparedPartitionData} from '../../../../../store/reducers/partitions/types';
import {formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import {prepareErrorMessage} from '../../../../../utils/prepareErrorMessage';
import {safeParseNumber} from '../../../../../utils/utils';
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

    startOffset?: number;
    endOffset?: number;
    scrollToOffset: (start: number, reset?: boolean) => void;
}

export function TopicDataControls({
    columnsToSelect,
    handleSelectedColumnsUpdate,

    startOffset,
    endOffset,
    partitions,
    partitionsLoading,
    partitionsError,
    scrollToOffset,
}: TopicDataControlsProps) {
    const {
        selectedPartition,
        handleSelectedPartitionChange: handleSelectedPartitionParamChange,
        handleSelectedOffsetChange,
        handleStartTimestampChange,
    } = useTopicDataQueryParams();

    const partitionsToSelect = partitions?.map(({partitionId}) => ({
        content: partitionId,
        value: partitionId,
    }));

    const handleSelectedPartitionChange = React.useCallback(
        (value: string[]) => {
            handleSelectedPartitionParamChange(value[0]);
            handleSelectedOffsetChange(undefined);
            handleStartTimestampChange(undefined);
        },
        [
            handleSelectedPartitionParamChange,
            handleStartTimestampChange,
            handleSelectedOffsetChange,
        ],
    );

    const scrollToStartOffset = React.useCallback(() => {
        if (startOffset) {
            scrollToOffset(startOffset, true);
        }
    }, [startOffset, scrollToOffset]);

    const scrollToEndOffset = React.useCallback(() => {
        if (endOffset) {
            scrollToOffset(endOffset, true);
        }
    }, [endOffset, scrollToOffset]);

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
            <TopicDataStartControls scrollToOffset={scrollToOffset} />
            <TableColumnSetup
                popupWidth={242}
                items={columnsToSelect}
                showStatus
                onUpdate={handleSelectedColumnsUpdate}
                sortable={false}
            />
            {!isNil(startOffset) && !isNil(endOffset) && (
                <Flex gap={0.5}>
                    <ActionTooltip title={i18n('action_scroll-up')}>
                        <Button
                            onClick={scrollToStartOffset}
                            view="flat-info"
                            selected
                            pin="round-brick"
                        >
                            <Icon size={14} data={ArrowUpToLine} />
                        </Button>
                    </ActionTooltip>
                    <EntitiesCount
                        label={i18n('label_offset')}
                        current={`${formatNumber(startOffset)}—${formatNumber(endOffset - 1)}`}
                        className={b('offsets-count')}
                    />
                    <ActionTooltip title={i18n('action_scroll-down')}>
                        <Button
                            onClick={scrollToEndOffset}
                            view="flat-info"
                            selected
                            pin="brick-round"
                        >
                            <Icon size={14} data={ArrowDownToLine} />
                        </Button>
                    </ActionTooltip>
                </Flex>
            )}
        </React.Fragment>
    );
}

interface TopicDataStartControlsProps {
    scrollToOffset: (start: number, reset?: boolean) => void;
}

function TopicDataStartControls({scrollToOffset}: TopicDataStartControlsProps) {
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
            if (value === 'TIMESTAMP') {
                handleSelectedOffsetChange(undefined);
            } else {
                handleStartTimestampChange(undefined);
            }
            handleTopicDataFilterChange(value);
        },
        [handleTopicDataFilterChange, handleSelectedOffsetChange, handleStartTimestampChange],
    );
    const onStartOffsetChange = React.useCallback(
        (value: string) => {
            handleSelectedOffsetChange(value);
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
                    endContent={
                        <ActionTooltip title={i18n('action_scroll-selected')}>
                            <Button
                                disabled={isNil(selectedOffset) || selectedOffset === ''}
                                view="flat-action"
                                size="xs"
                                onClick={() => {
                                    if (selectedOffset) {
                                        scrollToOffset(safeParseNumber(selectedOffset));
                                    }
                                }}
                            >
                                <Icon size={14} data={CircleChevronDownFill} />
                            </Button>
                        </ActionTooltip>
                    }
                    autoFocus
                />
            )}
            {topicDataFilter === 'TIMESTAMP' && (
                <RelativeDatePicker
                    format="YYYY-MM-DD HH:mm:ss"
                    placeholder="YYYY-MM-DD HH:mm:ss"
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
