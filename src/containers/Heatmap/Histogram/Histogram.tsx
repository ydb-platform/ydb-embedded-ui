import React from 'react';

import {Popup} from '@gravity-ui/uikit';

import type {IHeatmapMetricValue, IHeatmapTabletData} from '../../../types/store/heatmap';
import {cn} from '../../../utils/cn';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import {getColorRange, getCurrentMetricLimits} from '../util';

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
                        <td className={tooltipB('label')}>Count</td>
                        <td className={tooltipB('value')}>{count || '?'}</td>
                    </tr>
                    <tr>
                        <td className={tooltipB('label')}>From</td>
                        <td className={tooltipB('value')}>{leftBound || '?'}</td>
                    </tr>
                    <tr>
                        <td className={tooltipB('label')}>To</td>
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

    const histogramColorRange = getColorRange(50);
    const step = (max - min) / 50;

    const histogramRange: HistogramBarData[] = histogramColorRange.map((item, index) => {
        return {
            color: item,
            count: 0,
            leftBound: formatNumber(min + index * step),
            rightBound: formatNumber(min + (index + 1) * step),
        };
    });

    let maxCount = 0;

    tablets.forEach((tablet) => {
        const value = currentMetric && Number(tablet.metrics?.[currentMetric]);
        const bucketIndex = Math.floor((value as number) / step);
        const currentBucket = histogramRange[bucketIndex];
        const nextCountValue = (currentBucket?.count || 0) + 1;

        if (nextCountValue > maxCount) {
            maxCount = nextCountValue;
        }

        if (currentBucket) {
            histogramRange[bucketIndex] = {
                ...currentBucket,
                count: nextCountValue,
            };
        }
    });

    const [tooltipState, setTooltipState] = React.useState<HistogramTooltipState>({
        anchor: null,
        data: null,
    });

    const handleShowTooltip = (anchor: HTMLElement, data: HistogramTooltipData) => {
        setTooltipState({anchor, data});
    };

    const handleHideTooltip = () => {
        setTooltipState({anchor: null, data: null});
    };

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
