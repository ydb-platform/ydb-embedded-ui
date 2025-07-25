import React from 'react';

import {DefinitionList} from '@gravity-ui/uikit';

import {HoverPopup} from '../../../../../components/HoverPopup/HoverPopup';
import {
    MEMORY_SEGMENT_COLORS,
    getMemorySegmentColor,
    getMemorySegments,
} from '../../../../../components/MemoryViewer/utils';
import {ProgressViewer} from '../../../../../components/ProgressViewer/ProgressViewer';
import type {TMemoryStats} from '../../../../../types/api/nodes';
import {formatBytes} from '../../../../../utils/bytesParsers';
import {cn} from '../../../../../utils/cn';

import './MemoryProgressBar.scss';

const b = cn('memory-progress-bar');
const MIN_SEGMENT_WIDTH_PERCENT = 0.5;

const formatDetailedValues = (value?: number, total?: number): [string, string] => {
    return [
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
    ];
};

interface MemoryProgressBarProps {
    memoryStats?: TMemoryStats;
    memoryUsed?: string;
    memoryLimit?: string;
}

export function MemoryProgressBar({memoryStats, memoryUsed, memoryLimit}: MemoryProgressBarProps) {
    if (memoryStats) {
        // Full stats case - multi-segment progress bar
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

        const totalCapacity = memoryStats.HardLimit ? Number(memoryStats.HardLimit) : 100;
        const segmentWidths = displaySegments.map((segment) => {
            return Math.max((segment.value / totalCapacity) * 100, MIN_SEGMENT_WIDTH_PERCENT);
        });

        return (
            <HoverPopup
                renderPopupContent={() => (
                    <DefinitionList responsive>
                        {memorySegments.map(
                            ({label, value: segmentSize, capacity: segmentCapacity, key}) => (
                                <DefinitionList.Item
                                    key={label}
                                    name={
                                        <div className={b('popup-container')}>
                                            <div
                                                className={b('popup-legend')}
                                                style={{
                                                    backgroundColor: getMemorySegmentColor(key),
                                                }}
                                            />
                                            <div className={b('popup-name')}>{label}</div>
                                        </div>
                                    }
                                >
                                    {segmentCapacity ? (
                                        <ProgressViewer
                                            value={segmentSize}
                                            capacity={segmentCapacity}
                                            formatValues={formatDetailedValues}
                                            colorizeProgress
                                        />
                                    ) : (
                                        formatBytes({
                                            value: segmentSize,
                                            size: 'gb',
                                            withSizeLabel: true,
                                            precision: 2,
                                        })
                                    )}
                                </DefinitionList.Item>
                            ),
                        )}
                    </DefinitionList>
                )}
            >
                <div className={b('main-progress-container')}>
                    <div className={b('main-progress-bar')}>
                        {displaySegments.map((segment, index) => (
                            <div
                                key={segment.key}
                                className={b('main-segment')}
                                style={{
                                    width: `${segmentWidths[index]}%`,
                                    backgroundColor: getMemorySegmentColor(segment.key),
                                }}
                            />
                        ))}
                    </div>
                </div>
            </HoverPopup>
        );
    }

    // Simple case - single segment progress bar
    if (!memoryUsed || !memoryLimit) {
        return null;
    }

    const usedValue = Number(memoryUsed);
    const limitValue = Number(memoryLimit);
    const usagePercentage = Math.min((usedValue / limitValue) * 100, 100);

    return (
        <div className={b('main-progress-container')}>
            <div className={b('main-progress-bar')}>
                <div
                    className={b('main-segment')}
                    style={{
                        width: `${usagePercentage}%`,
                        backgroundColor: MEMORY_SEGMENT_COLORS['Other'],
                    }}
                />
            </div>
        </div>
    );
}
