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
import {Loader, Select} from '@yandex-cloud/uikit';
import ReactList from 'react-list';
import {AutoFetcher} from '../../utils/autofetcher';

import './Tablets.scss';
import TabletsOverall from '../../components/TabletsOverall/TabletsOverall';

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
        path: PropTypes.string,
        clearWasLoadingFlag: PropTypes.func,
        className: PropTypes.string,
    };

    autofetcher;

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

        if (!prevProps.path && this.props.path) {
            this.makeRequestIfPathOrNodeExist();
        }

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

    renderLoader = () => {
        return (
            <div className={b('loader-wrapper')}>
                <Loader size="m" />
            </div>
        );
    };

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
        const {stateFilter, typeFilter, className} = this.props;

        return (
            <div className={(b(), className)}>
                <div className={b('header')}>
                    <Select
                        className={b('filter-control')}
                        multiple
                        placeholder="All items"
                        label="States:"
                        options={states}
                        value={stateFilter}
                        onUpdate={this.handleStateFilterChange}
                        width="100%"
                    />
                    <Select
                        className={b('filter-control')}
                        multiple
                        placeholder="All items"
                        label="Types:"
                        options={types}
                        value={typeFilter}
                        onUpdate={this.handleTypeFilterChange}
                        width="100%"
                    />
                    <TabletsOverall tablets={tablets} />
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
            return this.renderLoader();
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
    const {data = {}, wasLoaded, loading, stateFilter, typeFilter} = state.tablets;
    const {autorefresh} = state.schema;
    const {TabletStateInfo: tablets = []} = data;
    return {
        tablets,
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
