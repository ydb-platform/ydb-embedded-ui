import {DefinitionList, useTheme} from '@gravity-ui/uikit';

import type {TMemoryStats} from '../../types/api/nodes';
import {cn} from '../../utils/cn';
import {calculateProgressStatus} from '../../utils/progress';
import {isNumeric} from '../../utils/utils';
import {HoverPopup} from '../HoverPopup/HoverPopup';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';

import {getMemorySegments} from './utils';

import './MemoryViewer.scss';

const b = cn('memory-viewer');

type FormatProgressViewerValues = (
    value?: number,
    capacity?: number,
    precision?: number,
) => (string | number | undefined)[];

export interface MemoryProgressViewerProps {
    stats: TMemoryStats;
    className?: string;
    warningThreshold?: number;
    value?: number | string;
    capacity?: number | string;
    formatValues: FormatProgressViewerValues;
    percents?: boolean;
    dangerThreshold?: number;
}

const MEMORY_PRECISION = 2;

export function MemoryViewer({
    stats,
    value,
    capacity,
    percents,
    formatValues,
    className,
    warningThreshold = 60,
    dangerThreshold = 80,
}: MemoryProgressViewerProps) {
    const theme = useTheme();
    let fillWidth =
        Math.round((parseFloat(String(value)) / parseFloat(String(capacity))) * 100) || 0;
    fillWidth = fillWidth > 100 ? 100 : fillWidth;
    let valueText: number | string | undefined = value,
        capacityText: number | string | undefined = capacity,
        divider = '/';
    if (percents) {
        valueText = fillWidth + '%';
        capacityText = '';
        divider = '';
    } else if (formatValues) {
        [valueText, capacityText] = formatValues(Number(value), Number(capacity), MEMORY_PRECISION);
    }

    const renderContent = () => {
        if (isNumeric(capacity)) {
            return `${valueText} ${divider} ${capacityText}`;
        }

        return valueText;
    };

    const calculateMemoryShare = (segmentSize: number) => {
        if (!value) {
            return 0;
        }
        return (segmentSize / parseFloat(String(capacity))) * 100;
    };

    const memorySegments = getMemorySegments(stats);

    const totalUsedMemory =
        memorySegments
            .filter(({isInfo}) => !isInfo)
            .reduce((acc, segment) => acc + calculateMemoryShare(segment.value), 0) /
        parseFloat(String(capacity));

    const status = calculateProgressStatus({
        fillWidth: totalUsedMemory,
        warningThreshold,
        dangerThreshold,
        colorizeProgress: true,
    });

    let currentPosition = 0;

    return (
        <HoverPopup
            popupContent={
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
                                        formatValues={(val, size) =>
                                            formatValues(val, size, MEMORY_PRECISION)
                                        }
                                        colorizeProgress
                                    />
                                ) : (
                                    formatValues(segmentSize, undefined, MEMORY_PRECISION)[0]
                                )}
                            </DefinitionList.Item>
                        ),
                    )}
                </DefinitionList>
            }
        >
            <div className={b({theme, status}, className)}>
                <div className={b('progress-container')}>
                    {memorySegments
                        .filter(({isInfo}) => !isInfo)
                        .map((segment) => {
                            const position = currentPosition;
                            currentPosition += calculateMemoryShare(segment.value);

                            return (
                                <div
                                    key={segment.key}
                                    className={b('segment', {type: segment.key})}
                                    style={{
                                        width: `${calculateMemoryShare(segment.value).toFixed(2)}%`,
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
