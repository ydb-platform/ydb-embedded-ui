import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import {Checkbox, Select} from '@gravity-ui/uikit';

import type {IHeatmapMetricValue} from '../../types/store/heatmap';
import {getTabletsInfo, setHeatmapOptions} from '../../store/reducers/heatmap';
import {showTooltip, hideTooltip} from '../../store/reducers/tooltip';
import {formatNumber} from '../../utils';
import {useAutofetcher, useTypedSelector} from '../../utils/hooks';

import {Loader} from '../../components/Loader';
import {ResponseError} from '../../components/Errors/ResponseError';

import {COLORS_RANGE_SIZE, getColorRange, getColorIndex, getCurrentMetricLimits} from './util';
import {HeatmapCanvas} from './HeatmapCanvas/HeatmapCanvas';
import {Histogram} from './Histogram/Histogram';

import './Heatmap.scss';

const b = cn('heatmap');
const COLORS_RANGE = getColorRange(COLORS_RANGE_SIZE);

interface HeatmapProps {
    path: string;
}

export const Heatmap = ({path}: HeatmapProps) => {
    const dispatch = useDispatch();

    const itemsContainer = React.createRef<HTMLDivElement>();

    const {autorefresh} = useTypedSelector((state) => state.schema);
    const {
        loading,
        wasLoaded,
        error,
        sort,
        heatmap,
        metrics,
        currentMetric,
        data: tablets = [],
    } = useTypedSelector((state) => state.heatmap);

    const [selectedMetric, setSelectedMetric] = useState(['']);

    useEffect(() => {
        if (!currentMetric && metrics && metrics.length) {
            dispatch(
                setHeatmapOptions({
                    currentMetric: metrics[0].value,
                }),
            );
        }
        if (currentMetric) {
            setSelectedMetric([currentMetric]);
        }
    }, [currentMetric, metrics, dispatch]);

    const fetchData = useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setHeatmapOptions({wasLoaded: false}));
            }
            dispatch(getTabletsInfo({path}));
        },
        [path, dispatch],
    );

    useAutofetcher(fetchData, [fetchData], autorefresh);

    const onShowTooltip = (...args: Parameters<typeof showTooltip>) => {
        dispatch(showTooltip(...args));
    };

    const onHideTooltip = () => {
        dispatch(hideTooltip);
    };

    const handleMetricChange = (value: string[]) => {
        dispatch(
            setHeatmapOptions({
                currentMetric: value[0] as IHeatmapMetricValue,
            }),
        );
    };
    const handleCheckboxChange = () => {
        dispatch(
            setHeatmapOptions({
                sort: !sort,
            }),
        );
    };

    const handleHeatmapChange = () => {
        dispatch(
            setHeatmapOptions({
                heatmap: !heatmap,
            }),
        );
    };

    const renderHistogram = () => {
        return (
            <Histogram
                tablets={tablets}
                currentMetric={currentMetric}
                showTooltip={onShowTooltip}
                hideTooltip={onHideTooltip}
            />
        );
    };

    const renderHeatmapCanvas = () => {
        const {min, max} = getCurrentMetricLimits(currentMetric, tablets);

        const preparedTablets = tablets.map((tablet) => {
            const value = currentMetric && Number(tablet.metrics?.[currentMetric]);
            const colorIndex = getColorIndex(value, min, max);
            const color = COLORS_RANGE[colorIndex];

            return {
                ...tablet,
                color,
                value,
                formattedValue: formatNumber(value),
                currentMetric,
            };
        });
        const sortedTablets = sort
            ? preparedTablets.sort((x, y) => Number(y.value) - Number(x.value))
            : preparedTablets;

        return (
            <div ref={itemsContainer} className={b('items')}>
                <HeatmapCanvas
                    tablets={sortedTablets}
                    parentRef={itemsContainer}
                    showTooltip={onShowTooltip}
                    hideTooltip={onHideTooltip}
                    currentMetric={currentMetric}
                />
            </div>
        );
    };

    const renderContent = () => {
        const {min, max} = getCurrentMetricLimits(currentMetric, tablets);

        return (
            <div className={b()}>
                <div className={b('filters')}>
                    <Select
                        className={b('heatmap-select')}
                        value={selectedMetric}
                        options={metrics}
                        onUpdate={handleMetricChange}
                        width={200}
                    />
                    <div className={b('sort-checkbox')}>
                        <Checkbox onUpdate={handleCheckboxChange} checked={sort}>
                            Sort
                        </Checkbox>
                    </div>
                    <div className={b('histogram-checkbox')}>
                        <Checkbox onUpdate={handleHeatmapChange} checked={heatmap}>
                            Heatmap
                        </Checkbox>
                    </div>
                    <div className={b('limits')}>
                        <div className={b('limits-block')}>
                            <div className={b('limits-title')}>min:</div>
                            <div className={b('limits-value')}>
                                {Number.isInteger(min) ? formatNumber(min) : '—'}
                            </div>
                        </div>
                        <div className={b('limits-block')}>
                            <div className={b('limits-title')}>max:</div>
                            <div className={b('limits-value')}>
                                {Number.isInteger(max) ? formatNumber(max) : '—'}
                            </div>
                        </div>
                        <div className={b('limits-block')}>
                            <div className={b('limits-title')}>count:</div>
                            <div className={b('limits-value')}>{formatNumber(tablets.length)}</div>
                        </div>
                    </div>
                </div>
                {heatmap ? renderHeatmapCanvas() : renderHistogram()}
            </div>
        );
    };

    if (loading && !wasLoaded) {
        return <Loader />;
    }

    if (error) {
        return <ResponseError error={error} />;
    }

    return renderContent();
};
