import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';

import DataTable from '@yandex-cloud/react-data-table';
import {Loader, TextInput, Label} from '@gravity-ui/uikit';

import ProblemFilter, {problemFilterType} from '../../components/ProblemFilter/ProblemFilter';
import {Illustration} from '../../components/Illustration';

import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import {withSearch} from '../../HOCS';
import {AUTO_RELOAD_INTERVAL, ALL, DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {getFilteredNodes} from '../../store/reducers/clusterNodes';
import {getNodes} from '../../store/reducers/nodes';
import {changeFilter} from '../../store/reducers/settings';
import {setHeader} from '../../store/reducers/header';
import routes, {CLUSTER_PAGES, createHref} from '../../routes';
import {calcUptime} from '../../utils';
import {getNodesColumns} from '../../utils/getNodesColumns';

import './Nodes.scss';

const b = cn('cluster-nodes');

class Nodes extends React.Component {
    static renderLoader() {
        return (
            <div className={'loader'}>
                <Loader size="l" />
            </div>
        );
    }

    static propTypes = {
        loading: PropTypes.bool,
        wasLoaded: PropTypes.bool,
        error: PropTypes.bool,
        getNodesList: PropTypes.func,
        nodes: PropTypes.array,
        showTooltip: PropTypes.func,
        hideTooltip: PropTypes.func,
        searchQuery: PropTypes.string,
        handleSearchQuery: PropTypes.func,
        filter: problemFilterType,
        changeFilter: PropTypes.func,
        setHeader: PropTypes.func,
        className: PropTypes.string,
        singleClusterMode: PropTypes.bool,
        additionalNodesInfo: PropTypes.object,
    };

    componentDidMount() {
        const {getNodesList, setHeader} = this.props;
        getNodesList();
        this.reloadDescriptor = setInterval(() => getNodesList(), AUTO_RELOAD_INTERVAL);
        setHeader([
            {
                text: CLUSTER_PAGES.nodes.title,
                link: createHref(routes.cluster, {activeTab: CLUSTER_PAGES.nodes.id}),
            },
        ]);
    }

    componentWillUnmount() {
        this.props.hideTooltip();
        clearInterval(this.reloadDescriptor);
    }

    handleSearchQueryChange = (search) => {
        this.props.handleSearchQuery(search);
    };

    handleFilterChange = (filter) => {
        this.props.changeFilter(filter);
    };

    renderControls() {
        const {searchQuery, filter, nodes} = this.props;

        return (
            <div className={b('controls')}>
                <TextInput
                    className={b('search')}
                    placeholder="Host name"
                    text={searchQuery}
                    onUpdate={this.handleSearchQueryChange}
                    hasClear
                />
                <ProblemFilter value={filter} onChange={this.handleFilterChange} />
                <Label theme="info" size="m">{`Nodes: ${nodes?.length}`}</Label>
            </div>
        );
    }

    renderTable = () => {
        const {
            nodes = [],
            filter,
            searchQuery,
            showTooltip,
            hideTooltip,
            singleClusterMode,
            additionalNodesInfo = {},
        } = this.props;

        const columns = getNodesColumns({
            showTooltip,
            hideTooltip,
            singleClusterMode,
            getNodeRef: additionalNodesInfo.getNodeRef,
        });

        let preparedNodes = searchQuery
            ? nodes.filter((node) =>
                  node.Host
                      ? node.Host.includes(searchQuery) || String(node.NodeId).includes(searchQuery)
                      : true,
              )
            : nodes;
        preparedNodes = preparedNodes.map((node) => ({
            ...node,
            uptime: calcUptime(node.StartTime),
        }));

        if (preparedNodes.length === 0) {
            if (filter !== ALL) {
                return <Illustration name="thumbsUp" width="200" />;
            }
        }

        return (
            <div className={b('table-wrapper')}>
                <div className={b('table-content')}>
                    <DataTable
                        theme="yandex-cloud"
                        data={preparedNodes}
                        columns={columns}
                        settings={DEFAULT_TABLE_SETTINGS}
                        initialSortOrder={{
                            columnId: 'NodeId',
                            order: DataTable.ASCENDING,
                        }}
                        emptyDataMessage='No such nodes'
                    />
                </div>
            </div>
        );
    };

    renderContent = () => {
        return (
            <div className={b(null, this.props.className)}>
                {this.renderControls()}
                {this.renderTable()}
            </div>
        );
    };

    render() {
        const {loading, wasLoaded, error} = this.props;

        if (loading && !wasLoaded) {
            return Nodes.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else {
            return this.renderContent();
        }
    }
}

const mapStateToProps = (state) => {
    const {wasLoaded, loading, error} = state.nodes;

    const nodes = getFilteredNodes(state);
    return {
        singleClusterMode: state.singleClusterMode,
        nodes,
        wasLoaded,
        loading,
        error,
        filter: state.settings.problemFilter,
    };
};

const mapDispatchToProps = {
    getNodesList: getNodes,
    hideTooltip,
    showTooltip,
    changeFilter,
    setHeader,
};

export default withSearch(connect(mapStateToProps, mapDispatchToProps)(Nodes));
