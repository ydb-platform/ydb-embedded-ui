import {DefinitionList, useTheme} from '@gravity-ui/uikit';

import type {TMemoryStats} from '../../types/api/nodes';
import {formatBytes} from '../../utils/bytesParsers';
import {cn} from '../../utils/cn';
import {GIGABYTE} from '../../utils/constants';
import {calculateProgressStatus} from '../../utils/progress';
import {isNumeric} from '../../utils/utils';
import {HoverPopup} from '../HoverPopup/HoverPopup';
import type {FormatProgressViewerValues} from '../ProgressViewer/ProgressViewer';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';

import {calculateAllocatedMemory, getMemorySegments} from './utils';

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
    className?: string;
    warningThreshold?: number;
    dangerThreshold?: number;
    formatValues: FormatProgressViewerValues;
    percents?: boolean;
}

export function MemoryViewer({
    stats,
    percents,
    formatValues,
    className,
    warningThreshold,
    dangerThreshold,
}: MemoryProgressViewerProps) {
    const memoryUsage = stats.AnonRss ?? calculateAllocatedMemory(stats);

    const capacity = stats.HardLimit;

    const theme = useTheme();
    let fillWidth =
        Math.floor((parseFloat(String(memoryUsage)) / parseFloat(String(capacity))) * 100) || 0;
    fillWidth = fillWidth > 100 ? 100 : fillWidth;
    let valueText: number | string | undefined = memoryUsage,
        capacityText: number | string | undefined = capacity,
        divider = '/';
    if (percents) {
        valueText = fillWidth + '%';
        capacityText = '';
        divider = '';
    } else if (formatValues) {
        [valueText, capacityText] = formatValues(Number(memoryUsage), Number(capacity));
    }

    const renderContent = () => {
        if (isNumeric(capacity)) {
            return `${valueText} ${divider} ${capacityText}`;
        }

        return valueText;
    };

    const calculateMemoryShare = (segmentSize: number) => {
        if (!memoryUsage) {
            return 0;
        }
        return (segmentSize / parseFloat(String(capacity))) * 100;
    };

    const memorySegments = getMemorySegments(stats, Number(memoryUsage));

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
                                    <div className={b('container')}>
                                        <div className={b('legend', {type: key})}></div>
                                        <div className={b('name')}>{label}</div>
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
            <div className={b({theme, status}, className)}>
                <div className={b('progress-container')}>
                    {memorySegments
                        .filter(({isInfo}) => !isInfo)
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
                    <div className={b('text')}>{renderContent()}</div>
                </div>
            </div>
        </HoverPopup>
    );
}
