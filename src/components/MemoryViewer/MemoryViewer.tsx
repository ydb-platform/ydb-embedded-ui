import React from 'react';

import {DefinitionList, useTheme} from '@gravity-ui/uikit';

import type {TMemoryStats} from '../../types/api/nodes';
import {cn} from '../../utils/cn';
import {formatNumber, roundToPrecision} from '../../utils/dataFormatters/dataFormatters';
import {calculateProgressStatus} from '../../utils/progress';
import {UNBREAKABLE_GAP, isNumeric} from '../../utils/utils';
import {HoverPopup} from '../HoverPopup/HoverPopup';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';

import i18n from './i18n';

import './MemoryViewer.scss';

const b = cn('memory-viewer');

type FormatProgressViewerValues = (
    value?: number,
    capacity?: number,
) => (string | number | undefined)[];

const formatValue2 = (value?: number) => {
    return formatNumber(roundToPrecision(Number(value), 2));
};

const defaultFormatValues: FormatProgressViewerValues = (value, total) => {
    return [formatValue2(value), formatValue2(total)];
};

type ProgressViewerSize = 'xs' | 's' | 'ns' | 'm' | 'n' | 'l' | 'head';

export interface MemoryProgressViewerProps {
    stats?: TMemoryStats;
    totalCapacity: number;
    className?: string;
    size?: ProgressViewerSize;
    warningThreshold?: number;
    value?: number | string;
    capacity?: number | string;
    formatValues?: FormatProgressViewerValues;
    percents?: boolean;
    dangerThreshold?: number;
}

export function MemoryViewer({
    stats,
    value,
    capacity,
    percents,
    formatValues = defaultFormatValues,
    totalCapacity,
    className,
    size = 'xs',
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
        [valueText, capacityText] = formatValues(Number(value), Number(capacity));
    }

    const renderContent = () => {
        if (isNumeric(capacity)) {
            return `${valueText} ${divider} ${capacityText}`;
        }

        return valueText;
    };

    const calculateMemoryPercentage = (value: number) => {
        if (!value) {
            return 0;
        }
        return parseFloat(((value / parseFloat(String(capacity))) * 100).toFixed(2));
    };

    const memorySegments = [
        {
            label: i18n('text_external-consumption'),
            key: 'ExternalConsumption',
            value: parseFloat(stats?.ExternalConsumption || '0'),
        },
        {
            label: i18n('text_allocator-caches'),
            key: 'AllocatorCachesMemory',
            value: parseFloat(stats?.AllocatorCachesMemory || '0'),
        },
        {
            label: i18n('text_shared-cache'),
            key: 'SharedCacheConsumption',
            value: parseFloat(stats?.SharedCacheConsumption || '0'),
            capacity: stats?.SharedCacheLimit,
        },
        {
            label: i18n('text_memtable'),
            key: 'MemTableConsumption',
            value: parseFloat(stats?.MemTableConsumption || '0'),
            capacity: stats?.MemTableLimit,
        },
        {
            label: i18n('text_query-execution'),
            key: 'QueryExecutionConsumption',
            value: parseFloat(stats?.QueryExecutionConsumption || '0'),
            capacity: stats?.QueryExecutionLimit,
        },
    ];

    console.log(memorySegments);

    const totalUsedMemory =
        memorySegments.reduce((acc, segment) => acc + calculateMemoryPercentage(segment.value), 0) /
        totalCapacity;

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
                    {memorySegments
                        .filter(({value}) => value)
                        .map(({label, value, capacity, key}) => (
                            <DefinitionList.Item
                                key={label}
                                name={
                                    <div className={b('container')}>
                                        <div className={b('legend', {type: key})}></div>
                                        <div className={b('name')}>{label}</div>
                                    </div>
                                }
                            >
                                <div className={b('memory-segment')}>
                                    {capacity ? (
                                        <React.Fragment>
                                            <ProgressViewer
                                                value={value}
                                                capacity={capacity}
                                                formatValues={formatValues}
                                                colorizeProgress
                                                percents
                                            />
                                            {UNBREAKABLE_GAP}
                                        </React.Fragment>
                                    ) : null}
                                    <div className={b('memory-segment-percentage')}>
                                        {formatValues(value, value)[1]}
                                    </div>
                                    {UNBREAKABLE_GAP + '/' + UNBREAKABLE_GAP}
                                    <div className={b('memory-segment-percentage')}>
                                        {calculateMemoryPercentage(value)}% total
                                    </div>
                                </div>
                            </DefinitionList.Item>
                        ))}
                </DefinitionList>
            }
        >
            <div className={b({size, theme, status}, className)}>
                <div className={b('progress-container')}>
                    {memorySegments.map((segment) => {
                        const position = currentPosition;
                        currentPosition += calculateMemoryPercentage(segment.value);

                        return (
                            <div
                                key={segment.key}
                                className={b('segment', {type: segment.key})}
                                style={{
                                    width: `${calculateMemoryPercentage(segment.value)}%`,
                                    left: `${position}%`,
                                }}
                            />
                        );
                    })}
                    {stats?.SoftLimit ? (
                        <div
                            className={b('soft-limit')}
                            style={{
                                width: '2px',
                                left: `${calculateMemoryPercentage(parseFloat(stats?.SoftLimit))}%`,
                            }}
                        />
                    ) : null}
                    {stats?.HardLimit ? (
                        <div
                            className={b('hard-limit')}
                            style={{
                                width: '2px',
                                left: `${calculateMemoryPercentage(parseFloat(stats?.HardLimit))}%`,
                            }}
                        />
                    ) : null}
                    <div className={b('text')}>{renderContent()}</div>
                </div>
            </div>
        </HoverPopup>
    );
}
