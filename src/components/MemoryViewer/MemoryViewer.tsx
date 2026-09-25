import {DefinitionList, Flex, useTheme} from '@gravity-ui/uikit';

import type {TMemoryStats} from '../../types/api/nodes';
import {formatBytes} from '../../utils/bytesParsers';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER, GIGABYTE} from '../../utils/constants';
import {getNodeMemory} from '../../utils/memory';
import type {FormatProgressViewerValues} from '../../utils/progress';
import {calculateProgressStatus} from '../../utils/progress';
import {isNumeric, parseOptionalNonNegativeNumber} from '../../utils/utils';
import {HoverPopup} from '../HoverPopup/HoverPopup';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';

import {getMemorySegments} from './utils';

import './MemoryViewer.scss';

const MIN_VISIBLE_MEMORY_SHARE = 1;
const MIN_VISIBLE_MEMORY_VALUE = 0.01 * GIGABYTE;

const b = cn('memory-viewer');

const formatDetailedValues: FormatProgressViewerValues = (value, total) => {
    return [
        formatBytes({
            value,
            size: 'gb',
            withSizeLabel: false,
            precision: 2,
        }),
        formatBytes({
            value: total,
            size: 'gb',
            withSizeLabel: true,
            precision: 1,
        }),
    ];
};

export interface MemoryProgressViewerProps {
    stats: TMemoryStats;
    memoryUsed?: string;
    memoryLimit?: string;
    className?: string;
    warningThreshold?: number;
    dangerThreshold?: number;
    formatValues: FormatProgressViewerValues;
    percents?: boolean;
}

export function MemoryViewer({
    stats,
    memoryUsed,
    memoryLimit: fallbackMemoryLimit,
    percents,
    formatValues,
    className,
    warningThreshold,
    dangerThreshold,
}: MemoryProgressViewerProps) {
    const {memoryUsed: memoryUsage, memoryLimit: capacity} = getNodeMemory({
        MemoryStats: stats,
        MemoryUsed: memoryUsed,
        MemoryLimit: fallbackMemoryLimit,
    });
    const theme = useTheme();

    if (memoryUsage === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    const fillWidth =
        capacity === undefined ? 0 : Math.min(100, Math.floor((memoryUsage / capacity) * 100));
    let valueText: number | string | undefined = memoryUsage,
        capacityText: number | string | undefined = capacity,
        divider = '/';
    if (percents && capacity !== undefined) {
        valueText = fillWidth + '%';
        capacityText = '';
        divider = '';
    } else if (formatValues) {
        [valueText, capacityText] = formatValues(memoryUsage, capacity);
    }

    const renderContent = () => {
        if (isNumeric(capacity)) {
            return `${valueText} ${divider} ${capacityText}`;
        }

        return valueText;
    };

    const calculateMemoryShare = (segmentSize: number) => {
        if (!memoryUsage || capacity === undefined) {
            return 0;
        }
        return (segmentSize / capacity) * 100;
    };

    // Without anonymous RSS, the backend's MemoryUsed excludes allocator caches.
    const allocatorCachesIncludedInUsage =
        parseOptionalNonNegativeNumber(memoryUsed) === undefined ||
        parseOptionalNonNegativeNumber(stats.AnonRss) !== undefined;
    const memorySegments = getMemorySegments(
        {...stats, HardLimit: capacity === undefined ? undefined : String(capacity)},
        memoryUsage,
        {
            allocatorCachesIncludedInUsage,
        },
    );

    const status = calculateProgressStatus({
        fillWidth,
        warningThreshold,
        dangerThreshold,
        colorizeProgress: true,
    });

    let currentPosition = 0;

    return (
        <HoverPopup
            renderPopupContent={() => (
                <DefinitionList responsive>
                    {memorySegments.map(
                        ({label, value: segmentSize, capacity: segmentCapacity, key}) => (
                            <DefinitionList.Item
                                key={label}
                                name={
                                    <Flex alignItems="center" gap="1" className={b('container')}>
                                        <div className={b('legend', {type: key})}></div>
                                        <div className={b('name')}>{label}</div>
                                    </Flex>
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
            <div className={b({theme, status}, className)}>
                <div className={capacity === undefined ? undefined : b('progress-container')}>
                    {memorySegments
                        .filter(({isInfo}) => !isInfo && capacity !== undefined)
                        .map((segment) => {
                            if (segment.value < MIN_VISIBLE_MEMORY_VALUE) {
                                return null;
                            }

                            const currentMemoryShare = Math.max(
                                calculateMemoryShare(segment.value),
                                MIN_VISIBLE_MEMORY_SHARE,
                            );
                            const position = currentPosition;
                            currentPosition += currentMemoryShare;

                            return (
                                <div
                                    key={segment.key}
                                    className={b('segment', {type: segment.key})}
                                    style={{
                                        width: `${currentMemoryShare}%`,
                                        left: `${position}%`,
                                    }}
                                />
                            );
                        })}
                    <Flex justifyContent="center" alignItems="center" className={b('text')}>
                        {renderContent()}
                    </Flex>
                </div>
            </div>
        </HoverPopup>
    );
}
