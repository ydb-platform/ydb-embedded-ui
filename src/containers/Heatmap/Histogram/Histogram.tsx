import React from 'react';

import {Popup} from '@gravity-ui/uikit';

import type {IHeatmapMetricValue, IHeatmapTabletData} from '../../../types/store/heatmap';
import {cn} from '../../../utils/cn';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import {getColorRange, getCurrentMetricLimits} from '../util';

import i18n from './i18n';

import './Histogram.scss';

const b = cn('histogram');
const tooltipB = cn('histogram-tooltip');

interface HistogramTooltipData {
    count?: number;
    leftBound?: string;
    rightBound?: string;
}

interface HistogramTooltipContentProps {
    data?: HistogramTooltipData | null;
}

const HistogramTooltipContent = ({data}: HistogramTooltipContentProps) => {
    if (!data) {
        return null;
    }

    const {count, leftBound, rightBound} = data;

    return (
        <div className={tooltipB()}>
            <table>
                <tbody>
                    <tr>
                        <td className={tooltipB('label')}>{i18n('label_count')}</td>
                        <td className={tooltipB('value')}>{count || '?'}</td>
                    </tr>
                    <tr>
                        <td className={tooltipB('label')}>{i18n('label_from')}</td>
                        <td className={tooltipB('value')}>{leftBound || '?'}</td>
                    </tr>
                    <tr>
                        <td className={tooltipB('label')}>{i18n('label_to')}</td>
                        <td className={tooltipB('value')}>{rightBound || '?'}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

interface HistogramBarData extends HistogramTooltipData {
    color?: string;
}

interface HistogramBarProps {
    data?: HistogramBarData;
    maxCount: number;
    onShowTooltip: (anchor: HTMLElement, data: HistogramTooltipData) => void;
    onHideTooltip: () => void;
}

const HistogramBar = ({data = {}, maxCount, onShowTooltip, onHideTooltip}: HistogramBarProps) => {
    const barRef = React.useRef<HTMLDivElement | null>(null);
    const {count, leftBound, rightBound, color} = data;

    const safeCount = Number(count) || 0;
    const height = maxCount > 0 ? (safeCount / maxCount) * 100 : 0;

    const handleMouseEnter = () => {
        const ref = barRef.current;
        if (!ref) {
            return;
        }

        onShowTooltip(ref, {
            count,
            leftBound,
            rightBound,
        });
    };

    const handleMouseLeave = () => {
        onHideTooltip();
    };

    return (
        <div
            ref={barRef}
            className={b('item')}
            style={{backgroundColor: color, height: `${height}%`}}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        />
    );
};

interface HistogramTooltipState {
    anchor: HTMLElement | null;
    data: HistogramTooltipData | null;
}

export interface HistogramProps {
    tablets: IHeatmapTabletData[];
    currentMetric?: IHeatmapMetricValue;
}

export const Histogram = ({tablets, currentMetric}: HistogramProps) => {
    const {min, max} = getCurrentMetricLimits(currentMetric, tablets);

    const {histogramRange, maxCount} = React.useMemo(() => {
        const histogramColorRange = getColorRange(50);
        const step = (max - min) / 50;

        if (step === 0 || !isFinite(step)) {
            // Handle edge case where all values are the same
            return {histogramRange: [], maxCount: 0};
        }

        const range: HistogramBarData[] = histogramColorRange.map((item, index) => {
            return {
                color: item,
                count: 0,
                leftBound: formatNumber(min + index * step),
                rightBound: formatNumber(min + (index + 1) * step),
            };
        });

        let currentMaxCount = 0;

        tablets.forEach((tablet) => {
            const rawValue = currentMetric && tablet.metrics?.[currentMetric];
            const value = Number(rawValue);

            // Skip invalid values (NaN, undefined, null, or out of range)
            if (!isFinite(value) || value < min || value > max) {
                return;
            }

            // Calculate bucket index with proper bounds checking
            const bucketIndex = Math.min(Math.floor((value - min) / step), range.length - 1);
            const currentBucket = range[bucketIndex];
            const nextCountValue = (currentBucket?.count || 0) + 1;

            if (nextCountValue > currentMaxCount) {
                currentMaxCount = nextCountValue;
            }

            if (currentBucket) {
                range[bucketIndex] = {
                    ...currentBucket,
                    count: nextCountValue,
                };
            }
        });

        return {histogramRange: range, maxCount: currentMaxCount};
    }, [tablets, currentMetric, min, max]);

    const [tooltipState, setTooltipState] = React.useState<HistogramTooltipState>({
        anchor: null,
        data: null,
    });

    const handleShowTooltip = React.useCallback(
        (anchor: HTMLElement, data: HistogramTooltipData) => {
            setTooltipState({anchor, data});
        },
        [],
    );

    const handleHideTooltip = React.useCallback(() => {
        setTooltipState({anchor: null, data: null});
    }, []);

    const renderHistogramItem = (item: HistogramBarData, index: number) => {
        return (
            <HistogramBar
                key={index}
                data={item}
                maxCount={maxCount}
                onShowTooltip={handleShowTooltip}
                onHideTooltip={handleHideTooltip}
            />
        );
    };

    return (
        <div className={b()}>
            {tooltipState.anchor && tooltipState.data ? (
                <Popup
                    open
                    hasArrow
                    placement={['top', 'bottom']}
                    anchorElement={tooltipState.anchor}
                    onOutsideClick={handleHideTooltip}
                >
                    <HistogramTooltipContent data={tooltipState.data} />
                </Popup>
            ) : null}
            <div className={b('chart')}>
                {Boolean(max) && histogramRange.map(renderHistogramItem)}
                <div className={b('x-min')}>{formatNumber(min)}</div>
                <div className={b('x-max')}>{formatNumber(max)}</div>
                <div className={b('y-min')}>0</div>
                <div className={b('y-max')}>{formatNumber(maxCount)}</div>
            </div>
        </div>
    );
};
