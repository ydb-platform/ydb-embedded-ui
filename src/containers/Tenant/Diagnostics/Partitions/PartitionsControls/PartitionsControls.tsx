import {useEffect, useMemo, useState} from 'react';
import {escapeRegExp} from 'lodash/fp';

import {TableColumnSetupItem} from '@gravity-ui/uikit/build/esm/components/Table/hoc/withTableSettings/withTableSettings';
import {Select, SelectOption, TableColumnSetup} from '@gravity-ui/uikit';

import type {ValueOf} from '../../../../../types/common';

import {Search} from '../../../../../components/Search/Search';

import type {PreparedPartitionDataWithHosts} from '../utils/types';
import {PARTITIONS_COLUMNS_IDS, PARTITIONS_COLUMNS_TITILES} from '../utils/constants';
import i18n from '../i18n';
import {b} from '../Partitions';

interface PartitionsControlsProps {
    consumers: string[] | undefined;
    selectedConsumer: string;
    onSelectedConsumerChange: (consumer: string) => void;
    selectDisabled: boolean;
    partitions: PreparedPartitionDataWithHosts[] | undefined;
    onSearchChange: (filteredPartitions: PreparedPartitionDataWithHosts[]) => void;
    hiddenColumns: string[];
    onHiddenColumnsChange: (newHiddenColumns: string[]) => void;
    initialColumnsIds: string[];
}

export const PartitionsControls = ({
    consumers,
    selectedConsumer,
    onSelectedConsumerChange,
    selectDisabled,
    partitions,
    onSearchChange,
    hiddenColumns,
    onHiddenColumnsChange,
    initialColumnsIds,
}: PartitionsControlsProps) => {
    const [generalSearchValue, setGeneralSearchValue] = useState('');
    const [partitionIdSearchValue, setPartitionIdSearchValue] = useState('');

    useEffect(() => {
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

            const isPartitionIdMatch = partitionIdRe.test(partitionId);

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

    const consumersToSelect = useMemo(() => {
        const options =
            consumers && consumers.length
                ? consumers.map((consumer) => ({
                      value: consumer,
                      content: consumer,
                  }))
                : [];

        return [{value: '', content: i18n('controls.consumerSelector.emptyOption')}, ...options];
    }, [consumers]);

    const columnsToSelect = useMemo(() => {
        return initialColumnsIds.map((id) => {
            return {
                title: PARTITIONS_COLUMNS_TITILES[id as ValueOf<typeof PARTITIONS_COLUMNS_IDS>],
                selected: Boolean(!hiddenColumns.includes(id)),
                id: id,
                required: id === PARTITIONS_COLUMNS_IDS.PARTITION_ID,
            };
        });
    }, [initialColumnsIds, hiddenColumns]);

    const handleConsumerSelectChange = (value: string[]) => {
        onSelectedConsumerChange(value[0]);
    };

    const handlePartitionIdSearchChange = (value: string) => {
        setPartitionIdSearchValue(value);
    };

    const handleGeneralSearchChange = (value: string) => {
        setGeneralSearchValue(value);
    };

    const hadleTableColumnsSetupChange = (value: TableColumnSetupItem[]) => {
        const result = [...hiddenColumns];

        // Process current set of columns
        // This way we do not remove from hidden these columns, that are not displayed currently
        // The reasons: set of columns differs for partitions with and without consumers
        value.forEach((el) => {
            if (!el.selected && !hiddenColumns.includes(el.id)) {
                result.push(el.id);
            } else if (el.selected && hiddenColumns.includes(el.id)) {
                result.splice(hiddenColumns.indexOf(el.id));
            }
        });

        onHiddenColumnsChange(result);
    };

    const renderOption = (option: SelectOption) => {
        return (
            <div className={b('select-option', {empty: option.value === ''})}>{option.content}</div>
        );
    };

    return (
        <div className={b('controls')}>
            <Select
                className={b('consumer-select')}
                label={i18n('controls.consumerSelector')}
                options={consumersToSelect}
                value={[selectedConsumer]}
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
            <TableColumnSetup
                key="TableColumnSetup"
                popupWidth="242px"
                items={columnsToSelect}
                showStatus
                onUpdate={hadleTableColumnsSetupChange}
            />
        </div>
    );
};
