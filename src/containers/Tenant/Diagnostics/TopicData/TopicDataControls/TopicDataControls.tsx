import React from 'react';

import type {Value} from '@gravity-ui/date-components';
import {RelativeDatePicker} from '@gravity-ui/date-components';
import {dateTimeParse} from '@gravity-ui/date-utils';
import {CircleChevronDownFill} from '@gravity-ui/icons';
import type {TableColumnSetupItem} from '@gravity-ui/uikit';
import {
    ActionTooltip,
    Button,
    Icon,
    RadioButton,
    Select,
    TableColumnSetup,
    Text,
} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {DebouncedInput} from '../../../../../components/DebouncedInput/DebouncedTextInput';
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
    scrollToOffset: (offset: number) => void;
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
        content: String(partitionId),
        value: String(partitionId),
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

            {!isNil(startOffset) && !isNil(endOffset) && (
                <Text color="secondary" whiteSpace="nowrap">
                    {formatNumber(startOffset)}—{formatNumber(endOffset - 1)}
                </Text>
            )}
            <TableColumnSetup
                popupWidth={242}
                items={columnsToSelect}
                showStatus
                onUpdate={handleSelectedColumnsUpdate}
                sortable={false}
            />
        </React.Fragment>
    );
}

interface TopicDataStartControlsProps {
    scrollToOffset: (offset: number) => void;
}

function TopicDataStartControls({scrollToOffset}: TopicDataStartControlsProps) {
    const {
        selectedOffset,
        startTimestamp,
        topicDataFilter,
        activeOffset,
        handleSelectedOffsetChange,
        handleStartTimestampChange,
        handleTopicDataFilterChange,
    } = useTopicDataQueryParams();

    const inputRef = React.useRef<HTMLInputElement>(null);

    const isDrawerVisible = !isNil(activeOffset);

    React.useEffect(() => {
        if (isDrawerVisible) {
            inputRef.current?.blur();
        }
    }, [isDrawerVisible]);

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
                    controlRef={inputRef}
                    className={b('offset-input')}
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
                                className={b('scroll-button')}
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
