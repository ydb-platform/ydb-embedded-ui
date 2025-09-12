import React from 'react';

import {Checkbox, Select} from '@gravity-ui/uikit';

import {ResponseError} from '../../components/Errors/ResponseError';
import {Loader} from '../../components/Loader';
import {heatmapApi, setHeatmapOptions} from '../../store/reducers/heatmap';
import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import type {IHeatmapMetricValue} from '../../types/store/heatmap';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatNumber} from '../../utils/dataFormatters/dataFormatters';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import {HeatmapCanvas} from './HeatmapCanvas/HeatmapCanvas';
import {Histogram} from './Histogram/Histogram';
import {COLORS_RANGE_SIZE, getColorIndex, getColorRange, getCurrentMetricLimits} from './util';

import './Heatmap.scss';

const b = cn('heatmap');
const COLORS_RANGE = getColorRange(COLORS_RANGE_SIZE);

interface HeatmapProps {
    database: string;
    databaseFullPath: string;
    path: string;
}

export const Heatmap = ({path, database, databaseFullPath}: HeatmapProps) => {
    const dispatch = useTypedDispatch();

    const itemsContainer = React.createRef<HTMLDivElement>();

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {currentData, isFetching, error} = heatmapApi.useGetHeatmapTabletsInfoQuery(
        {path, database, databaseFullPath},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;

    const {tablets = [], metrics} = currentData || {};
    const {sort, heatmap, currentMetric} = useTypedSelector((state) => state.heatmap);

    const onShowTooltip = (...args: Parameters<typeof showTooltip>) => {
        dispatch(showTooltip(...args));
    };

    const onHideTooltip = () => {
        dispatch(hideTooltip());
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
                />
            </div>
        );
    };

    const renderContent = () => {
        const {min, max} = getCurrentMetricLimits(currentMetric, tablets);

        let content;
        if (!error || currentData) {
            content = heatmap ? renderHeatmapCanvas() : renderHistogram();
        }

        return (
            <div className={b()}>
                <div className={b('filters')}>
                    <Select
                        className={b('heatmap-select')}
                        value={currentMetric ? [currentMetric] : []}
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
                                {Number.isInteger(min) ? formatNumber(min) : EMPTY_DATA_PLACEHOLDER}
                            </div>
                        </div>
                        <div className={b('limits-block')}>
                            <div className={b('limits-title')}>max:</div>
                            <div className={b('limits-value')}>
                                {Number.isInteger(max) ? formatNumber(max) : EMPTY_DATA_PLACEHOLDER}
                            </div>
                        </div>
                        <div className={b('limits-block')}>
                            <div className={b('limits-title')}>count:</div>
                            <div className={b('limits-value')}>{formatNumber(tablets.length)}</div>
                        </div>
                    </div>
                </div>
                {error ? <ResponseError error={error} /> : null}
                {content}
            </div>
        );
    };

    if (loading) {
        return <Loader />;
    }

    return renderContent();
};
