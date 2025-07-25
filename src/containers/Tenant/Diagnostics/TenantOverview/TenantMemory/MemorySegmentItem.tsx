import React from 'react';

import {DefinitionList, Flex, Progress, Text} from '@gravity-ui/uikit';

import type {MemorySegment} from '../../../../../components/MemoryViewer/utils';
import {getMemorySegmentColor} from '../../../../../components/MemoryViewer/utils';
import {cn} from '../../../../../utils/cn';
import {formatSegmentValue} from '../../../../../utils/progress';

const b = cn('memory-details');

interface MemorySegmentItemProps {
    segment: MemorySegment;
}

export function MemorySegmentItem({segment}: MemorySegmentItemProps) {
    const segmentColor = React.useMemo(() => {
        return getMemorySegmentColor(segment.key);
    }, [segment.key]);

    const valueText = React.useMemo(() => {
        return formatSegmentValue(segment.value, segment.capacity);
    }, [segment.value, segment.capacity]);

    const progressValue = React.useMemo(() => {
        return segment.capacity ? (segment.value / segment.capacity) * 100 : 100;
    }, [segment.value, segment.capacity]);

    const progressStyle: React.CSSProperties & Record<string, string> = React.useMemo(() => {
        return {
            '--g-progress-filled-background-color': segmentColor,
        };
    }, [segmentColor]);

    return (
        <div className={b('segment-row')}>
            <div className={b('segment-indicator')} style={{backgroundColor: segmentColor}} />
            <DefinitionList nameMaxWidth={200} className={b('segment-definition-list')}>
                <DefinitionList.Item
                    name={
                        <Text variant="body-1" color="secondary">
                            {segment.label}
                        </Text>
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
            </DefinitionList>
        </div>
    );
}
