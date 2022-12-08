import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';

import DataTable from '@yandex-cloud/react-data-table';
import {Loader, TextInput, Label} from '@gravity-ui/uikit';

import {ProblemFilter} from '../../components/ProblemFilter';
import {Illustration} from '../../components/Illustration';
import {AccessDenied} from '../../components/Errors/403';
import {UptimeFilter} from '../../components/UptimeFIlter';

import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import {withSearch} from '../../HOCS';
import {AUTO_RELOAD_INTERVAL, ALL, DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {getFilteredNodes} from '../../store/reducers/clusterNodes';
import {getNodes, setNodesUptimeFilter} from '../../store/reducers/nodes';
import {changeFilter} from '../../store/reducers/settings';
import {setHeader} from '../../store/reducers/header';
import routes, {CLUSTER_PAGES, createHref} from '../../routes';
import {calcUptime} from '../../utils';
import {getNodesColumns} from '../../utils/getNodesColumns';
import {NodesUptimeFilterValues} from '../../utils/nodes';

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
        problemFilter: PropTypes.string,
        changeFilter: PropTypes.func,
        setHeader: PropTypes.func,
        className: PropTypes.string,
        singleClusterMode: PropTypes.bool,
        additionalNodesInfo: PropTypes.object,
        nodesUptimeFilter: PropTypes.string,
        setNodesUptimeFilter: PropTypes.func,
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

    handleProblemFilterChange = (value) => {
        this.props.changeFilter(value);
    };

    handleUptimeFilterChange = (value) => {
        this.props.setNodesUptimeFilter(value);
    };

    renderControls() {
        const {nodes, searchQuery, problemFilter, nodesUptimeFilter} = this.props;

        return (
            <div className={b('controls')}>
                <TextInput
                    className={b('search')}
                    placeholder="Host name"
                    value={searchQuery}
                    onUpdate={this.handleSearchQueryChange}
                    hasClear
                    autoFocus
                />
                <ProblemFilter value={problemFilter} onChange={this.handleProblemFilterChange} />
                <UptimeFilter value={nodesUptimeFilter} onChange={this.handleUptimeFilterChange} />
                <Label theme="info" size="m">{`Nodes: ${nodes?.length}`}</Label>
            </div>
        );
    }

    renderTable = () => {
        const {
            nodes = [],
            problemFilter,
            nodesUptimeFilter,
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
            ? nodes.filter((node) => {
                  const re = new RegExp(searchQuery, 'i');
                  return node.Host ? re.test(node.Host) || re.test(String(node.NodeId)) : true;
              })
            : nodes;
        preparedNodes = preparedNodes.map((node) => ({
            ...node,
            uptime: calcUptime(node.StartTime),
        }));

        if (preparedNodes.length === 0) {
            if (problemFilter !== ALL || nodesUptimeFilter !== NodesUptimeFilterValues.All) {
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
                        emptyDataMessage="No such nodes"
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
            if (error.status === 403) {
                return <AccessDenied />;
            }

            return <div>{error.statusText}</div>;
        } else {
            return this.renderContent();
        }
    }
}

const mapStateToProps = (state) => {
    const {wasLoaded, loading, error, nodesUptimeFilter} = state.nodes;

    const nodes = getFilteredNodes(state);
    return {
        singleClusterMode: state.singleClusterMode,
        nodes,
        wasLoaded,
        loading,
        error,
        problemFilter: state.settings.problemFilter,
        nodesUptimeFilter,
    };
};

const mapDispatchToProps = {
    getNodesList: getNodes,
    hideTooltip,
    showTooltip,
    changeFilter,
    setHeader,
    setNodesUptimeFilter,
};

export default withSearch(connect(mapStateToProps, mapDispatchToProps)(Nodes));
