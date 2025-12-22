import React from 'react';

import {DefinitionList, Flex, Progress, Text} from '@gravity-ui/uikit';

import type {MemorySegment} from '../../../../../components/MemoryViewer/utils';
import {getMemorySegmentColor} from '../../../../../components/MemoryViewer/utils';
import progressI18n from '../../../../../components/ProgressWrapper/i18n';
import {cn} from '../../../../../utils/cn';
import {formatStorageValuesToGb} from '../../../../../utils/dataFormatters/dataFormatters';

const b = cn('memory-details');

interface MemorySegmentsListProps {
    segments: MemorySegment[];
    className?: string;
}

export function MemorySegmentsList({segments, className}: MemorySegmentsListProps) {
    // TODO: Stretch content https://github.com/gravity-ui/uikit/issues/2353
    return (
        <DefinitionList nameMaxWidth={200} responsive className={className}>
            {segments.map((segment) => {
                const segmentColor = getMemorySegmentColor(segment.key);
                const [valueFormatted, capacityFormatted] = formatStorageValuesToGb(
                    segment.value,
                    segment.capacity,
                );
                const valueText = segment.capacity
                    ? progressI18n('context_capacity-usage', {
                          value: valueFormatted,
                          capacity: capacityFormatted,
                      })
                    : valueFormatted;
                const progressValue = segment.capacity
                    ? (segment.value / segment.capacity) * 100
                    : 100;
                const progressStyle: React.CSSProperties & Record<string, string> = {
                    '--g-progress-filled-background-color': segmentColor,
                };

                return (
                    <DefinitionList.Item
                        key={segment.key}
                        name={
                            <Flex alignItems="center" gap="1">
                                <div
                                    className={b('segment-indicator')}
                                    style={{backgroundColor: segmentColor}}
                                />
                                <Text variant="body-1" color="secondary">
                                    {segment.label}
                                </Text>
                            </Flex>
                        }
                    >
                        <Flex alignItems="center" gap="3">
                            <div className={b('segment-progress')}>
                                <div style={progressStyle}>
                                    <Progress
                                        value={progressValue}
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
                );
            })}
        </DefinitionList>
    );
}
