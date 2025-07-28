import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';

import i18n from '../../../../../components/MemoryViewer/i18n';
import {getMemorySegments} from '../../../../../components/MemoryViewer/utils';
import {ProgressWrapper} from '../../../../../components/ProgressWrapper';
import type {TMemoryStats} from '../../../../../types/api/nodes';
import {cn} from '../../../../../utils/cn';
import {formatStorageValuesToGb} from '../../../../../utils/dataFormatters/dataFormatters';

import {MemorySegmentItem} from './MemorySegmentItem';

import './MemoryDetailsSection.scss';

const b = cn('memory-details');

interface MemoryDetailsSectionProps {
    memoryStats: TMemoryStats;
}

export function MemoryDetailsSection({memoryStats}: MemoryDetailsSectionProps) {
    const memoryUsage = React.useMemo(() => {
        if (memoryStats.AnonRss === undefined) {
            return (
                Number(memoryStats.AllocatedMemory || 0) +
                Number(memoryStats.AllocatorCachesMemory || 0)
            );
        } else {
            return Number(memoryStats.AnonRss);
        }
    }, [memoryStats.AnonRss, memoryStats.AllocatedMemory, memoryStats.AllocatorCachesMemory]);

    const memorySegments = React.useMemo(() => {
        return getMemorySegments(memoryStats, memoryUsage);
    }, [memoryStats, memoryUsage]);

    const displaySegments = React.useMemo(() => {
        return memorySegments.filter((segment) => !segment.isInfo && segment.value > 0);
    }, [memorySegments]);

    const formatValues = React.useCallback((value?: number, total?: number): [string, string] => {
        return formatStorageValuesToGb(value, total) as [string, string];
    }, []);

    return (
        <Flex direction="column" alignItems="flex-start" gap="3">
            <div className={b('header')}>
                <Text variant="body-1" className={b('title')}>
                    {i18n('text_memory-details')}
                </Text>
            </div>
            <Flex direction="column" alignItems="flex-start" gap="4" width="100%">
                <div className={b('main-progress')}>
                    <ProgressWrapper
                        stack={memorySegments}
                        totalCapacity={memoryStats.HardLimit}
                        formatValues={formatValues}
                        className={b('main-progress-bar')}
                        size="m"
                        width="full"
                    />
                </div>
                <Flex
                    direction="column"
                    alignItems="flex-start"
                    gap="2"
                    className={b('segments-container')}
                >
                    {displaySegments.map((segment) => (
                        <MemorySegmentItem key={segment.key} segment={segment} />
                    ))}
                </Flex>
            </Flex>
        </Flex>
    );
}
