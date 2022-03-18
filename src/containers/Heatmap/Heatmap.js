import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';

import {getTabletsInfo, setHeatmapOptions} from '../../store/reducers/heatmap';
import {showTooltip, hideTooltip} from '../../store/reducers/tooltip';
import {COLORS_RANGE_SIZE, getColorRange, getColorIndex, getCurrentMetricLimits} from './util';
import {formatNumber} from '../../utils';

import {Loader, Checkbox} from '@yandex-cloud/uikit';
import {Select} from '@yandex-cloud/uikit/build/esm/components/unstable/Select';
import {HeatmapCanvas} from './HeatmapCanvas/HeatmapCanvas';
import {Histogram} from './Histogram/Histogram';
import {AutoFetcher} from '../../utils/autofetcher';

import './Heatmap.scss';

const b = cn('heatmap');
const COLORS_RANGE = getColorRange(COLORS_RANGE_SIZE);

const PageLoader = () => (
    <div className={b('loader')}>
        <Loader size="m" />
    </div>
);

class Heatmap extends React.Component {
    static propTypes = {
        tablets: PropTypes.array,
        error: PropTypes.bool,
        wasLoaded: PropTypes.bool,
        loading: PropTypes.bool,
        showTooltip: PropTypes.func,
        hideTooltip: PropTypes.func,
        getTabletsInfo: PropTypes.func,
        nodeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        path: PropTypes.string,
        clearWasLoadingFlag: PropTypes.func,
        metrics: PropTypes.array,
        sort: PropTypes.bool,
        heatmap: PropTypes.bool,
        currentMetric: PropTypes.string,
        setHeatmapOptions: PropTypes.func,
    };
    autofetcher;

    componentDidMount() {
        this.getTablets();
        this.autofetcher = new AutoFetcher();
        this.setInitialMetric();
        if (this.props.autorefresh) {
            this.autofetcher.start();
            this.autofetcher.fetch(() => this.getTablets());
        }
    }
    componentDidUpdate(prevProps) {
        const {path, autorefresh} = this.props;

        if (path && prevProps.path !== path) {
            this.props.setHeatmapOptions({
                wasLoaded: false,
            });
            this.getTablets();
        }

        if (autorefresh && !prevProps.autorefresh) {
            this.getTablets();
            this.autofetcher.start();
            this.autofetcher.fetch(() => this.getTablets());
        }
        if (!autorefresh && prevProps.autorefresh) {
            this.autofetcher.stop();
        }

        this.setInitialMetric();
    }
    componentWillUnmount() {
        this.autofetcher.stop();
    }

    itemsContainer = React.createRef();

    setInitialMetric = () => {
        const {metrics, currentMetric} = this.props;

        if (!currentMetric && metrics && metrics.length) {
            this.props.setHeatmapOptions({
                currentMetric: metrics[0].value,
            });
        }
    };
    getTablets = () => {
        const {path} = this.props;

        this.props.getTabletsInfo({path});
    };
    _onMetricChange = (value) => {
        this.props.setHeatmapOptions({
            currentMetric: value,
        });
    };
    _onCheckboxChange = () => {
        this.props.setHeatmapOptions({
            sort: !this.props.sort,
        });
    };
    _onHeatmapChange = () => {
        this.props.setHeatmapOptions({
            heatmap: !this.props.heatmap,
        });
    };
    renderHistogram() {
        const {tablets, currentMetric} = this.props;

        return (
            <Histogram
                tablets={tablets}
                currentMetric={currentMetric}
                showTooltip={this.props.showTooltip}
                hideTooltip={this.props.hideTooltip}
            />
        );
    }
    renderHeatmapCanvas() {
        const {tablets, currentMetric, sort} = this.props;

        const {min, max} = getCurrentMetricLimits(currentMetric, tablets);

        const preparedTablets = tablets.map((tablet) => {
            const value = currentMetric && Number(tablet.metrics[currentMetric]);
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
            ? preparedTablets.sort((a, b) => b.value - a.value)
            : preparedTablets;

        return (
            <div ref={this.itemsContainer} className={b('items')}>
                <HeatmapCanvas
                    tablets={sortedTablets}
                    parentRef={this.itemsContainer}
                    showTooltip={this.props.showTooltip}
                    hideTooltip={this.props.hideTooltip}
                    currentMetric={currentMetric}
                />
            </div>
        );
    }
    renderContent() {
        const {tablets, metrics, currentMetric, heatmap, sort} = this.props;

        const {min, max} = getCurrentMetricLimits(currentMetric, tablets);

        return (
            <div className={b()}>
                <div className={b('filters')}>
                    <Select
                        className={b('heatmap-select')}
                        value={currentMetric}
                        options={metrics}
                        onUpdate={this._onMetricChange}
                        width={200}
                    />
                    <div className={b('sort-checkbox')}>
                        <Checkbox onUpdate={this._onCheckboxChange} checked={sort}>
                            Sort
                        </Checkbox>
                    </div>
                    <div className={b('histogram-checkbox')}>
                        <Checkbox onUpdate={this._onHeatmapChange} checked={heatmap}>
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
                {heatmap ? this.renderHeatmapCanvas() : this.renderHistogram()}
            </div>
        );
    }
    render() {
        const {loading, wasLoaded} = this.props;

        return loading && !wasLoaded ? <PageLoader /> : this.renderContent();
    }
}

const mapStateToProps = (state) => {
    const {
        loading,
        data: tablets = [],
        metrics,
        sort,
        heatmap,
        currentMetric,
        wasLoaded,
    } = state.heatmap;
    const {autorefresh} = state.schema;

    return {
        tablets,
        loading,
        metrics,
        sort,
        heatmap,
        currentMetric,
        wasLoaded,
        autorefresh,
    };
};

const mapDispatchToProps = {
    getTabletsInfo,
    hideTooltip,
    showTooltip,
    setHeatmapOptions,
};

export default connect(mapStateToProps, mapDispatchToProps)(Heatmap);
