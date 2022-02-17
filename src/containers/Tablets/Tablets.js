import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';

import {
    getTabletsInfo,
    clearWasLoadingFlag,
    setStateFilter,
    setTypeFilter,
} from '../../store/reducers/tablets';
import {showTooltip, hideTooltip} from '../../store/reducers/tooltip';

import Tablet from '../../components/Tablet/Tablet';
import {Loader, Progress} from '@yandex-cloud/uikit';
import {Select} from '@yandex-cloud/uikit/build/esm/components/unstable/Select';
import ReactList from 'react-list';
import {COLORS_PRIORITY} from '../../utils/constants';
import {AutoFetcher} from '../Cluster/Cluster';

import './Tablets.scss';

// чтобы при очень маленьком проценте все равно были видны проблемные места, установим минимальный процент в 3
const minOverallPercentValue = 3;

const b = cn('tablets');

class Tablets extends React.Component {
    static propTypes = {
        tablets: PropTypes.array,
        error: PropTypes.bool,
        wasLoaded: PropTypes.bool,
        loading: PropTypes.bool,
        showTooltip: PropTypes.func,
        hideTooltip: PropTypes.func,
        getTabletsInfo: PropTypes.func,
        nodeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        timeoutForRequest: PropTypes.number,
        path: PropTypes.string,
        clearWasLoadingFlag: PropTypes.func,
    };

    autofetcher;

    static renderLoader() {
        return (
            <div className={b('loader-wrapper')}>
                <Loader size="m" />
            </div>
        );
    }

    state = {
        filteredTablets: [],
    };

    componentDidMount() {
        this.makeRequestIfPathOrNodeExist();
        this.autofetcher = new AutoFetcher();
        if (this.props.autorefresh) {
            this.autofetcher.start();
            this.autofetcher.fetch(() => this.makeRequestIfPathOrNodeExist());
        }
    }

    componentDidUpdate(prevProps) {
        const {autorefresh} = this.props;
        if (prevProps.path && this.props.path && prevProps.path !== this.props.path) {
            this.props.clearWasLoadingFlag();
            this.makeRequestIfPathOrNodeExist();
        }

        if (autorefresh && !prevProps.autorefresh) {
            this.makeRequestIfPathOrNodeExist();
            this.autofetcher.stop();
            this.autofetcher.start();
            this.autofetcher.fetch(() => this.makeRequestIfPathOrNodeExist());
        }
        if (!autorefresh && prevProps.autorefresh) {
            this.autofetcher.stop();
        }
    }

    componentWillUnmount() {
        this.autofetcher.stop();
    }

    makeRequestIfPathOrNodeExist = () => {
        const {nodeId, path} = this.props;
        if (typeof nodeId !== 'undefined') {
            this.props.getTabletsInfo({nodes: [nodeId]}).then(this.updateFilteredTablets);
        } else if (typeof path !== 'undefined') {
            this.props.getTabletsInfo({path}).then(this.updateFilteredTablets);
        }
    };

    handleStateFilterChange = (stateFilter) => {
        this.props.setStateFilter(stateFilter);
        this.updateFilteredTablets();
    };

    handleTypeFilterChange = (typeFilter) => {
        this.props.setTypeFilter(typeFilter);
        this.updateFilteredTablets();
    };

    renderTablet = (tablet, tabletIndex) => {
        return (
            <Tablet
                onMouseLeave={this.props.hideTooltip}
                onMouseEnter={this.props.showTooltip}
                tablet={this.state.filteredTablets[parseInt(tabletIndex, 10)]}
                key={tabletIndex}
                size={this.props.size}
                className={b('tablet')}
            />
        );
    };

    updateFilteredTablets = () => {
        const {stateFilter, typeFilter} = this.props;
        const {tablets} = this.props;

        let filteredTablets = tablets;

        if (typeFilter.length > 0) {
            filteredTablets = filteredTablets.filter((tblt) =>
                typeFilter.some((filter) => tblt.Type === filter),
            );
        }
        if (stateFilter.length > 0) {
            filteredTablets = filteredTablets.filter((tblt) =>
                stateFilter.some((filter) => tblt.State === filter),
            );
        }
        this.setState({filteredTablets});
    };

    renderOverall = (tablets) => {
        const {hideTooltip, showTooltip} = this.props;
        const tabletsCount = tablets.length;

        const substractPercentsFromMaxPercents = (statesForOverallProgress, substractValue) => {
            Object.keys(statesForOverallProgress).some((key) => {
                if (statesForOverallProgress[key] > 10) {
                    statesForOverallProgress[key] -= minOverallPercentValue - substractValue;
                    return true;
                }
                return false;
            });
        };

        // определим, сколько таблеток какого цвета имеется в tablets
        const statesForOverallProgress = tablets.reduce((acc, tablet) => {
            const color = tablet.Overall.toLowerCase();
            if (!acc[color]) {
                acc[color] = 1;
            } else {
                acc[color]++;
            }

            return acc;
        }, {});

        const tooltipData = [];

        // подсчитаем, сколько процентов составляет каждый цвет в statesForOverallProgress и заодно сгенерируем информацию для тултипа
        Object.keys(statesForOverallProgress).forEach((key) => {
            const percents = (statesForOverallProgress[key] / tabletsCount) * 100;
            const value = statesForOverallProgress[key];
            statesForOverallProgress[key] = percents;
            tooltipData.push({color: key, percents, value, total: tablets.length});
        });

        // заменим все проценты, значения которых меньше 3 на тройку
        Object.keys(statesForOverallProgress).forEach((key) => {
            if (statesForOverallProgress[key] < minOverallPercentValue) {
                substractPercentsFromMaxPercents(
                    statesForOverallProgress,
                    statesForOverallProgress[key],
                );
                statesForOverallProgress[key] = minOverallPercentValue;
            }
        });

        const memoryProgress = 100;
        const stack = Object.keys(statesForOverallProgress).map((key) => ({
            color: `var(--color-status-${key}-solid-70)`,
            colorKey: key,
            value: statesForOverallProgress[key],
        }));

        // сортируем наш stack, чтобы цвета были в порядке "зеленый, оранжевый, желтый, красный, черный"
        stack.sort((a, b) => COLORS_PRIORITY[b.colorKey] - COLORS_PRIORITY[a.colorKey]);

        return (
            <div className={b('row', {overall: true})}>
                <span className={b('label', {overall: true})}>Overall</span>
                <div
                    onMouseLeave={hideTooltip}
                    onMouseEnter={(e) => showTooltip(e.target, tooltipData, 'tabletsOverall')}
                >
                    <Progress value={memoryProgress} stack={stack} />
                </div>
            </div>
        );
    };

    renderContent = (tablets) => {
        const states = Array.from(new Set(...[tablets.map((tblt) => tblt.State)])).map((item) => ({
            value: item,
            content: item,
        }));
        const types = Array.from(new Set(...[tablets.map((tblt) => tblt.Type)])).map((item) => ({
            value: item,
            content: item,
        }));
        const {filteredTablets} = this.state;
        const {stateFilter, typeFilter} = this.props;

        return (
            <div className={b()}>
                {this.renderOverall(tablets)}

                <div className={b('filters')}>
                    <Select
                        className={b('filter-control')}
                        multiple
                        placeholder="All"
                        label="States:"
                        options={states}
                        value={stateFilter}
                        onUpdate={this.handleStateFilterChange}
                        width="100%"
                    />
                    <Select
                        className={b('filter-control')}
                        multiple
                        placeholder="All"
                        label="Types:"
                        options={types}
                        value={typeFilter}
                        onUpdate={this.handleTypeFilterChange}
                        width="100%"
                    />
                </div>

                <div className={b('items')}>
                    <ReactList
                        itemRenderer={this.renderTablet}
                        length={filteredTablets.length}
                        type="uniform"
                    />
                </div>
            </div>
        );
    };

    render() {
        const {loading, wasLoaded, error, tablets} = this.props;
        if (loading && !wasLoaded) {
            return Tablets.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else {
            return tablets.length > 0 ? (
                this.renderContent(tablets)
            ) : (
                <div className="error">no tablets data</div>
            );
        }
    }
}

const mapStateToProps = (state) => {
    const {
        data = {},
        wasLoaded,
        loading,
        timeoutForRequest,
        stateFilter,
        typeFilter,
    } = state.tablets;
    const {autorefresh} = state.schema;
    const {TabletStateInfo: tablets = []} = data;
    return {
        tablets,
        timeoutForRequest,
        wasLoaded,
        loading,
        stateFilter,
        typeFilter,
        autorefresh,
    };
};

const mapDispatchToProps = {
    getTabletsInfo,
    hideTooltip,
    showTooltip,
    clearWasLoadingFlag,
    setStateFilter,
    setTypeFilter,
};

export default connect(mapStateToProps, mapDispatchToProps)(Tablets);
