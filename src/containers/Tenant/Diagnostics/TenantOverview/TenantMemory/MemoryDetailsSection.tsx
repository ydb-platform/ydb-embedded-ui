import {DefinitionList, Flex, Progress, Text} from '@gravity-ui/uikit';

import i18n from '../../../../../components/MemoryViewer/i18n';
import {
    getMemorySegmentColor,
    getMemorySegments,
} from '../../../../../components/MemoryViewer/utils';
import type {TMemoryStats} from '../../../../../types/api/nodes';
import {formatBytes} from '../../../../../utils/bytesParsers';
import {cn} from '../../../../../utils/cn';
import {ProgressWrapper} from '../TenantStorage/ProgressWrapper';

import './MemoryDetailsSection.scss';

const b = cn('memory-details');

interface MemoryDetailsSectionProps {
    memoryStats: TMemoryStats;
}

export function MemoryDetailsSection({memoryStats}: MemoryDetailsSectionProps) {
    let memoryUsage: number;
    if (memoryStats.AnonRss === undefined) {
        memoryUsage =
            Number(memoryStats.AllocatedMemory || 0) +
            Number(memoryStats.AllocatorCachesMemory || 0);
    } else {
        memoryUsage = Number(memoryStats.AnonRss);
    }

    const memorySegments = getMemorySegments(memoryStats, Number(memoryUsage));
    const displaySegments = memorySegments.filter(
        (segment) => !segment.isInfo && segment.value > 0,
    );

    return (
        <div className={b()}>
            <div className={b('header')}>
                <Text variant="body-1" className={b('title')}>
                    {i18n('text_memory-details')}
                </Text>
            </div>
            <div className={b('content')}>
                <div className={b('main-progress')}>
                    <ProgressWrapper
                        stack={memorySegments}
                        totalCapacity={memoryStats.HardLimit}
                        formatValues={(value?: number, total?: number): [string, string] => [
                            formatBytes({
                                value: value || 0,
                                size: 'gb',
                                withSizeLabel: false,
                                precision: 2,
                            }),
                            formatBytes({
                                value: total || 0,
                                size: 'gb',
                                withSizeLabel: true,
                                precision: 1,
                            }),
                        ]}
                        className={b('main-progress-bar')}
                        size="m"
                        width="full"
                    />
                </div>
                <div className={b('segments-container')}>
                    {displaySegments.map((segment) => {
                        const segmentColor = getMemorySegmentColor(segment.key);
                        let valueText: string;
                        if (segment.capacity) {
                            valueText = `${formatBytes({value: segment.value, size: 'tb', withSizeLabel: false, precision: 2})} of ${formatBytes({value: segment.capacity, size: 'tb', withSizeLabel: true, precision: 0})}`;
                        } else {
                            valueText = formatBytes({
                                value: segment.value,
                                size: 'gb',
                                withSizeLabel: true,
                                precision: 1,
                            });
                        }

                        return (
                            <div key={segment.key} className={b('segment-row')}>
                                <div
                                    className={b('segment-indicator')}
                                    style={{backgroundColor: segmentColor}}
                                />
                                <DefinitionList
                                    nameMaxWidth={200}
                                    className={b('segment-definition-list')}
                                >
                                    <DefinitionList.Item
                                        name={
                                            <Text variant="body-1" color="secondary">
                                                {segment.label}
                                            </Text>
                                        }
                                    >
                                        <Flex alignItems="center" gap="3">
                                            <div className={b('segment-progress')}>
                                                <div
                                                    style={
                                                        {
                                                            '--g-progress-filled-background-color':
                                                                getMemorySegmentColor(segment.key),
                                                        } as React.CSSProperties
                                                    }
                                                >
                                                    <Progress
                                                        value={
                                                            segment.capacity
                                                                ? (segment.value /
                                                                      segment.capacity) *
                                                                  100
                                                                : 100
                                                        }
                                                        size="s"
                                                        className={b('progress-bar')}
                                                    />
                                                </div>
                                            </div>
                                            <Text variant="body-1" color="secondary">
                                                {valueText}
                                            </Text>
                                        </Flex>
                                    </DefinitionList.Item>
                                </DefinitionList>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
