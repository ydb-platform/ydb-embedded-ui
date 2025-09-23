import React from 'react';

import type {SelectOption} from '@gravity-ui/uikit';
import {Select} from '@gravity-ui/uikit';
import escapeRegExp from 'lodash/escapeRegExp';

import {Search} from '../../../../../components/Search/Search';
import {b} from '../Partitions';
import i18n from '../i18n';
import type {PreparedPartitionDataWithHosts} from '../utils/types';

interface PartitionsControlsProps {
    consumers: string[] | undefined;
    selectedConsumer?: string;
    onSelectedConsumerChange: (consumer?: string) => void;
    selectDisabled: boolean;
    partitions: PreparedPartitionDataWithHosts[] | undefined;
    onSearchChange: (filteredPartitions: PreparedPartitionDataWithHosts[]) => void;
}

export const PartitionsControls = ({
    consumers,
    selectedConsumer,
    onSelectedConsumerChange,
    selectDisabled,
    partitions,
    onSearchChange,
}: PartitionsControlsProps) => {
    const [generalSearchValue, setGeneralSearchValue] = React.useState('');
    const [partitionIdSearchValue, setPartitionIdSearchValue] = React.useState('');

    React.useEffect(() => {
        if (!partitions) {
            return;
        }

        const partitionIdRe = new RegExp(escapeRegExp(partitionIdSearchValue), 'i');
        const generalRe = new RegExp(escapeRegExp(generalSearchValue), 'i');

        const filteredPartitions = partitions.filter((partition) => {
            const {
                partitionId,
                readerName,
                readSessionId,
                partitionNodeId,
                connectionNodeId,
                partitionHost,
                connectionHost,
            } = partition;

            const isPartitionIdMatch = partitionIdRe.test(String(partitionId));

            const otherValues = [
                readerName,
                readSessionId,
                partitionNodeId,
                connectionNodeId,
                partitionHost,
                connectionHost,
            ]
                .filter(Boolean)
                .map(String);

            const isOtherValuesMatch =
                otherValues.length === 0 || otherValues.some((value) => generalRe.test(value));

            return isPartitionIdMatch && isOtherValuesMatch;
        });

        onSearchChange(filteredPartitions);
    }, [partitionIdSearchValue, generalSearchValue, partitions, onSearchChange]);

    const consumersToSelect = React.useMemo(() => {
        const options =
            consumers && consumers.length
                ? consumers.map((consumer) => ({
                      value: consumer,
                      content: consumer,
                  }))
                : [];

        return [{value: '', content: i18n('controls.consumerSelector.emptyOption')}, ...options];
    }, [consumers]);

    const handleConsumerSelectChange = (value: string[]) => {
        // Do not set empty string to state
        onSelectedConsumerChange(value[0] || undefined);
    };

    const handlePartitionIdSearchChange = (value: string) => {
        setPartitionIdSearchValue(value);
    };

    const handleGeneralSearchChange = (value: string) => {
        setGeneralSearchValue(value);
    };

    const renderOption = (option: SelectOption) => {
        return (
            <div className={b('select-option', {empty: option.value === ''})}>{option.content}</div>
        );
    };

    return (
        <React.Fragment>
            <Select
                className={b('consumer-select')}
                label={i18n('controls.consumerSelector')}
                options={consumersToSelect}
                value={[selectedConsumer || '']}
                onUpdate={handleConsumerSelectChange}
                filterable={consumers && consumers.length > 5}
                disabled={selectDisabled || !consumers || !consumers.length}
                renderOption={renderOption}
                renderSelectedOption={renderOption}
            />
            <Search
                onChange={handlePartitionIdSearchChange}
                placeholder={i18n('controls.partitionSearch')}
                className={b('search', {partition: true})}
                value={partitionIdSearchValue}
            />
            <Search
                onChange={handleGeneralSearchChange}
                placeholder={i18n('controls.generalSearch')}
                className={b('search', {general: true})}
                value={generalSearchValue}
            />
        </React.Fragment>
    );
};
