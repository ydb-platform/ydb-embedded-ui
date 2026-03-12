import React from 'react';

import {isNil} from 'lodash';

import {useClusterWithProxy} from '../../../../store/reducers/cluster/cluster';
import {partitionsApi} from '../../../../store/reducers/partitions/partitions';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import {safeParseNumber} from '../../../../utils/utils';

interface UseTopicPartitionsParams {
    path: string;
    database: string;
    databaseFullPath: string;
    selectedPartition: string | null | undefined;
    onPartitionAutoSelect: (partitionId: string) => void;
}

interface UseTopicPartitionsResult {
    partitions: ReturnType<typeof partitionsApi.useGetPartitionsQuery>['data'];
    partitionsLoading: boolean;
    partitionsError: unknown;
    /** Start offset of the selected partition (from partitions list, initial value) */
    baseOffset: number | undefined;
    /** End offset of the selected partition (from partitions list, initial value) */
    endOffset: number | undefined;
    setEndOffset: React.Dispatch<React.SetStateAction<number | undefined>>;
}

export function useTopicPartitions({
    path,
    database,
    databaseFullPath,
    selectedPartition,
    onPartitionAutoSelect,
}: UseTopicPartitionsParams): UseTopicPartitionsResult {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const useMetaProxy = useClusterWithProxy();

    const [baseOffset, setBaseOffset] = React.useState<number>();
    const [endOffset, setEndOffset] = React.useState<number>();

    const {
        data: partitions,
        isLoading: partitionsLoading,
        error: partitionsError,
    } = partitionsApi.useGetPartitionsQuery(
        {path, database, databaseFullPath, useMetaProxy},
        {pollingInterval: autoRefreshInterval},
    );

    const prevSelectedPartition = React.useRef(selectedPartition);

    // Sync baseOffset/endOffset from partition data when partition changes or on first load
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

    // Auto-select first partition when none is selected
    React.useEffect(() => {
        if (partitions && partitions.length && isNil(selectedPartition)) {
            const firstPartitionId = partitions[0].partitionId;
            if (!isNil(firstPartitionId)) {
                onPartitionAutoSelect(String(firstPartitionId));
            }
        }
    }, [partitions, selectedPartition, onPartitionAutoSelect]);

    return {
        partitions,
        partitionsLoading,
        partitionsError,
        baseOffset,
        endOffset,
        setEndOffset,
    };
}
