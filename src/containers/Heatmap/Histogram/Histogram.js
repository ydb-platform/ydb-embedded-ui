import React from 'react';

import PropTypes from 'prop-types';

import {cn} from '../../../utils/cn';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import {getColorRange, getCurrentMetricLimits} from '../util';

import './Histogram.scss';

const b = cn('histogram');

const HistogramBar = (props) => {
    const barRef = React.useRef();
    const {data = {}, maxCount} = props;
    const {count, leftBound, rightBound, color} = data;
    const height = (count / maxCount) * 100;

    const _onHistogramItemEnter = () => {
        const ref = barRef.current;

        props.showTooltip(
            ref,
            {
                count,
                leftBound,
                rightBound,
            },
            'histogram',
        );
    };

    return (
        <div
            ref={barRef}
            className={b('item')}
            style={{backgroundColor: color, height: `${height}%`}}
            onMouseEnter={_onHistogramItemEnter}
            onMouseLeave={props.hideTooltip}
        />
    );
};
HistogramBar.propTypes = {
    data: PropTypes.object,
    maxCount: PropTypes.number,
    showTooltip: PropTypes.func,
    hideTooltip: PropTypes.func,
};

export const Histogram = (props) => {
    const {tablets, currentMetric} = props;
    const {min, max} = getCurrentMetricLimits(currentMetric, tablets);

    const histogramColorRange = getColorRange(50);
    const step = (max - min) / 50;
    const histogramRange = histogramColorRange.map((item, index) => {
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
        const bucketIndex = Math.floor(value / step);
        const nextCountValue = histogramRange[bucketIndex]?.count + 1;

        if (nextCountValue > maxCount) {
            maxCount = nextCountValue;
        }

        histogramRange[bucketIndex] = {
            ...histogramRange[bucketIndex],
            count: nextCountValue,
        };
    });

    const renderHistogramItem = (item, index) => {
        return (
            <HistogramBar
                key={index}
                data={item}
                maxCount={maxCount}
                showTooltip={props.showTooltip}
                hideTooltip={props.hideTooltip}
            />
        );
    };

    return (
        <div className={b()}>
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
Histogram.propTypes = {
    tablets: PropTypes.array,
    currentMetric: PropTypes.string,
    showTooltip: PropTypes.func,
    hideTooltip: PropTypes.func,
};
