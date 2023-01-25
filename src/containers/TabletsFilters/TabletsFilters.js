import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';
import qs from 'qs';
import _ from 'lodash';

import {Loader, Select} from '@gravity-ui/uikit';
import ReactList from 'react-list';

import Tablet from '../../components/Tablet/Tablet';
import {AccessDenied} from '../../components/Errors/403';

import {tabletColorToTabletState, tabletStates} from '../../utils/tablet';
import {showTooltip, hideTooltip} from '../../store/reducers/tooltip';
import {
    getTabletsInfo,
    clearWasLoadingFlag,
    setStateFilter,
    setTypeFilter,
    getFilteredTablets,
    getTablets,
} from '../../store/reducers/tabletsFilters';

import './TabletsFilters.scss';

const b = cn('tablets-filters');

class TabletsFilters extends React.Component {
    static propTypes = {
        wasLoaded: PropTypes.bool,
        loading: PropTypes.bool,
        showTooltip: PropTypes.func,
        hideTooltip: PropTypes.func,
        getTabletsInfo: PropTypes.func,
        timeoutForRequest: PropTypes.number,
        path: PropTypes.string,
        clearWasLoadingFlag: PropTypes.func,
        nodes: PropTypes.array,
        tablets: PropTypes.array,
        filteredTablets: PropTypes.array,
        setStateFilter: PropTypes.func,
        setTypeFilter: PropTypes.func,
        stateFilter: PropTypes.array,
        typeFilter: PropTypes.array,
        error: PropTypes.oneOf([PropTypes.string, PropTypes.object]),
    };

    static renderLoader() {
        return (
            <div className={'loader'}>
                <Loader size="l" />
            </div>
        );
    }

    static parseNodes = (nodes) => {
        if (Array.isArray(nodes)) {
            return nodes.map(Number).filter(Number.isInteger);
        }
    };

    static getStateFiltersFromColor = (color) => {
        return tabletColorToTabletState[color] || [color];
    };

    static CONTROL_WIDTH = 220;
    static POPUP_WIDTH = 300;

    state = {
        nodeFilter: [],
        tenantPath: '',
    };

    reloadDescriptor = -1;

    componentDidMount() {
        const {setStateFilter, setTypeFilter} = this.props;

        const queryParams = qs.parse(this.props.location.search, {
            ignoreQueryPrefix: true,
        });
        const {nodeIds, type, path, state} = queryParams;
        const nodes = TabletsFilters.parseNodes(nodeIds);
        const stateFilter = TabletsFilters.getStateFiltersFromColor(state);

        setStateFilter(stateFilter);
        setTypeFilter([type]);

        this.setState({nodeFilter: nodes, tenantPath: path}, () => {
            this.makeRequest();
        });
    }

    componentDidUpdate(prevProps) {
        const {loading, error} = this.props;
        if (!error && prevProps.path && this.props.path && prevProps.path !== this.props.path) {
            this.props.clearWasLoadingFlag();
            this.getTablets();
        }

        if (!error && !loading && this.reloadDescriptor === -1) {
            this.getTablets();
        }
    }

    componentWillUnmount() {
        clearInterval(this.reloadDescriptor);
    }

    makeRequest = () => {
        const {nodeFilter, tenantPath} = this.state;

        this.props.getTabletsInfo({nodes: nodeFilter, path: [tenantPath]});
    };

    getTablets = () => {
        const {timeoutForRequest} = this.props;
        clearInterval(this.reloadDescriptor);
        this.reloadDescriptor = setTimeout(() => {
            this.makeRequest();
            this.reloadDescriptor = -1;
        }, timeoutForRequest);
    };

    handleNodeFilterChange = (nodeFilter) => {
        this.setState({nodeFilter}, () => {
            this.props.clearWasLoadingFlag();
            this.makeRequest();
        });
    };

    handleStateFilterChange = (stateFilter) => {
        const {setStateFilter} = this.props;
        setStateFilter(stateFilter);
    };

    handleTypeFilterChange = (typeFilter) => {
        const {setTypeFilter} = this.props;
        setTypeFilter(typeFilter);
    };

    renderTablet = (index, key) => {
        const {filteredTablets, hideTooltip, showTooltip, size} = this.props;

        return (
            <Tablet
                onMouseLeave={hideTooltip}
                onMouseEnter={showTooltip}
                tablet={filteredTablets[index]}
                key={key}
                size={size}
                className={b('tablet')}
            />
        );
    };

    renderContent = () => {
        const {nodeFilter, tenantPath} = this.state;
        const {tablets, filteredTablets, nodes, stateFilter, typeFilter, error} = this.props;

        const states = tabletStates.map((item) => ({value: item, content: item}));
        const types = Array.from(new Set(...[_.map(tablets, (tblt) => tblt.Type)])).map((item) => ({
            value: item,
            content: item,
        }));

        const nodesForSelect = _.map(nodes, (node) => ({
            content: node.Id,
            value: node.Id,
            meta: node.Host,
        }));

        return (
            <div className={b()}>
                {tenantPath ? (
                    <div className={b('tenant')}>
                        <>
                            <span className={b('label')}>Database: </span> {tenantPath}
                        </>
                    </div>
                ) : null}
                <MemoizedFilters
                    nodesForSelect={nodesForSelect}
                    nodeFilter={nodeFilter}
                    onChangeNodes={this.handleNodeFilterChange}
                    states={states}
                    stateFilter={stateFilter}
                    onChangeStates={this.handleStateFilterChange}
                    types={types}
                    typeFilter={typeFilter}
                    onChangeTypes={this.handleTypeFilterChange}
                />

                {error && <div className="error">{error}</div>}

                {filteredTablets.length > 0 ? (
                    <div className={b('items')}>
                        <ReactList
                            itemRenderer={this.renderTablet}
                            length={filteredTablets.length}
                            type="uniform"
                        />
                    </div>
                ) : (
                    !error && <div className={b('empty-message')}>no tablets</div>
                )}
            </div>
        );
    };

    render() {
        const {loading, wasLoaded, error} = this.props;

        if (loading && !wasLoaded) {
            return TabletsFilters.renderLoader();
        } else if (error && typeof error === 'object') {
            if (error.status === 403) {
                return <AccessDenied />;
            }

            return <div>{error.statusText}</div>;
        } else {
            return this.renderContent();
        }
    }
}

const Filters = ({
    nodesForSelect,
    nodeFilter,
    onChangeNodes,

    states,
    stateFilter,
    onChangeStates,

    types,
    typeFilter,
    onChangeTypes,
}) => {
    return (
        <div className={b('filters')}>
            <div className={b('filter-wrapper')}>
                <Select
                    multiple
                    label="Node ID"
                    width={TabletsFilters.CONTROL_WIDTH}
                    popupWidth={TabletsFilters.POPUP_WIDTH}
                    placeholder="All"
                    options={nodesForSelect}
                    value={nodeFilter}
                    onUpdate={onChangeNodes}
                    renderOption={(option) => {
                        return (
                            <div className={b('node')}>
                                <div>{option.content}</div>
                                <div className={b('node-meta')} title={option.meta}>
                                    {option.meta}
                                </div>
                            </div>
                        );
                    }}
                    getOptionHeight={() => 40}
                />
            </div>

            <div className={b('filter-wrapper')}>
                <Select
                    multiple
                    label="multiple"
                    width={TabletsFilters.CONTROL_WIDTH}
                    placeholder="All"
                    options={states}
                    value={stateFilter}
                    onUpdate={onChangeStates}
                />
            </div>

            <div className={b('filter-wrapper')}>
                <Select
                    multiple
                    label="Types"
                    width={TabletsFilters.CONTROL_WIDTH}
                    placeholder="All"
                    options={types}
                    value={typeFilter}
                    onUpdate={onChangeTypes}
                />
            </div>
        </div>
    );
};

Filters.propTypes = {
    nodesForSelect: PropTypes.array,
    nodeFilter: PropTypes.array,
    onChangeNodes: PropTypes.func,

    states: PropTypes.array,
    stateFilter: PropTypes.array,
    onChangeStates: PropTypes.func,

    types: PropTypes.array,
    typeFilter: PropTypes.array,
    onChangeTypes: PropTypes.func,
};

const MemoizedFilters = React.memo(Filters, (prevProps, nextProps) => {
    return (
        _.isEqual(prevProps.nodeFilter, nextProps.nodeFilter) &&
        _.isEqual(prevProps.stateFilter, nextProps.stateFilter) &&
        _.isEqual(prevProps.typeFilter, nextProps.typeFilter)
    );
});

const mapStateToProps = (state) => {
    const {nodes, wasLoaded, loading, timeoutForRequest, stateFilter, typeFilter, error} =
        state.tabletsFilters;

    return {
        tablets: getTablets(state),
        filteredTablets: getFilteredTablets(state),
        nodes,
        timeoutForRequest,
        wasLoaded,
        loading,
        stateFilter,
        typeFilter,
        error,
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

export default connect(mapStateToProps, mapDispatchToProps)(TabletsFilters);
