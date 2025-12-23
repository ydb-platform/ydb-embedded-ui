import React from 'react';

import {Checkbox, Popup, Select} from '@gravity-ui/uikit';

import {ResponseError} from '../../components/Errors/ResponseError';
import {Loader} from '../../components/Loader';
import {TabletTooltipContent} from '../../components/TooltipsContent';
import {useClusterWithProxy} from '../../store/reducers/cluster/cluster';
import {heatmapApi, setHeatmapOptions} from '../../store/reducers/heatmap';
import type {IHeatmapMetricValue, IHeatmapTabletData} from '../../types/store/heatmap';
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
    const useMetaProxy = useClusterWithProxy();

    const itemsContainer = React.useRef<HTMLDivElement | null>(null);

    const [tabletTooltip, setTabletTooltip] = React.useState<{
        tablet: IHeatmapTabletData;
        position: {left: number; top: number};
    } | null>(null);
    const [tabletTooltipAnchorElement, setTabletTooltipAnchorElement] =
        React.useState<HTMLDivElement | null>(null);
    const isTabletTooltipHoveredRef = React.useRef(false);

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {currentData, isFetching, error} = heatmapApi.useGetHeatmapTabletsInfoQuery(
        {path, database, databaseFullPath, useMetaProxy},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;

    const {tablets = [], metrics} = currentData || {};
    const {sort, heatmap, currentMetric} = useTypedSelector((state) => state.heatmap);

    const handleShowTabletTooltip = React.useCallback(
        (tablet: IHeatmapTabletData, position: {left: number; top: number}) => {
            setTabletTooltip({tablet, position});
        },
        [],
    );

    const handleHideTabletTooltip = React.useCallback(() => {
        setTabletTooltip(null);
    }, []);

    const handleRequestHideTabletTooltip = React.useCallback(() => {
        setTabletTooltip((prev) => {
            if (!prev || isTabletTooltipHoveredRef.current) {
                return prev;
            }

            return null;
        });
    }, []);

    const handleTooltipMouseEnter = React.useCallback(() => {
        isTabletTooltipHoveredRef.current = true;
    }, []);

    const handleTooltipMouseLeave = React.useCallback(() => {
        isTabletTooltipHoveredRef.current = false;
        handleHideTabletTooltip();
    }, [handleHideTabletTooltip]);

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
        return <Histogram tablets={tablets} currentMetric={currentMetric} />;
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
                {tabletTooltip ? (
                    <div
                        key={`${tabletTooltip.position.left}-${tabletTooltip.position.top}`}
                        ref={setTabletTooltipAnchorElement}
                        className={b('tooltip-anchor')}
                        style={{
                            left: tabletTooltip.position.left,
                            top: tabletTooltip.position.top,
                        }}
                    />
                ) : null}
                <HeatmapCanvas
                    tablets={sortedTablets}
                    parentRef={itemsContainer}
                    onShowTabletTooltip={handleShowTabletTooltip}
                    onHideTabletTooltip={handleRequestHideTabletTooltip}
                />
            </div>
        );
    };

    const renderContent = () => {
        const {min, max} = getCurrentMetricLimits(currentMetric, tablets);
        const isTabletTooltipPopupOpen = Boolean(tabletTooltip && tabletTooltipAnchorElement);

        let content;
        if (!error || currentData) {
            content = heatmap ? renderHeatmapCanvas() : renderHistogram();
        }

        return (
            <div className={b()}>
                {isTabletTooltipPopupOpen ? (
                    <Popup
                        open
                        hasArrow
                        placement={['top', 'bottom', 'left', 'right']}
                        anchorElement={tabletTooltipAnchorElement}
                        onOutsideClick={handleHideTabletTooltip}
                    >
                        <div
                            className={b('tooltip')}
                            onMouseEnter={handleTooltipMouseEnter}
                            onMouseLeave={handleTooltipMouseLeave}
                        >
                            <TabletTooltipContent data={tabletTooltip?.tablet} />
                        </div>
                    </Popup>
                ) : null}
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
