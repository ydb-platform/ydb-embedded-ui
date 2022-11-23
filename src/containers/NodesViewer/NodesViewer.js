import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {TextInput, Label} from '@gravity-ui/uikit';
import DataTable from '@yandex-cloud/react-data-table';

import ProblemFilter, {problemFilterType} from '../../components/ProblemFilter/ProblemFilter';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {Illustration} from '../../components/Illustration';

import {withSearch} from '../../HOCS';
import {calcUptime} from '../../utils';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {changeFilter} from '../../store/reducers/settings';
import {filterNodesByStatusAndUptime} from '../../store/reducers/clusterNodes';
import {setNodesUptimeFilter} from '../../store/reducers/nodes';
import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import {getNodesColumns} from '../../utils/getNodesColumns';

import './NodesViewer.scss';

const b = cn('nodes-viewer');

class NodesViewer extends React.PureComponent {
    static selectNodesToShow(nodes, searchQuery) {
        let preparedNodes = nodes;
        if (nodes && Array.isArray(nodes)) {
            preparedNodes = nodes
                .map((node) => {
                    node.uptime = calcUptime(node.StartTime);
                    return node;
                })
                /*  Filter by nodes with the Host field.
                If a node does not have a Host field it is also
                included in the filter and displayed with a dash in the corresponding column
            */
                .filter((node) => (node.Host ? node.Host.includes(searchQuery) : true));
        }
        return preparedNodes;
    }

    static propTypes = {
        nodes: PropTypes.array.isRequired,
        className: PropTypes.string,
        searchQuery: PropTypes.string,
        handleSearchQuery: PropTypes.func,
        showTooltip: PropTypes.func,
        hideTooltip: PropTypes.func,
        problemFilter: problemFilterType,
        nodesUptimeFilter: PropTypes.string,
        setNodesUptimeFilter: PropTypes.func,
        changeFilter: PropTypes.func,
        showControls: PropTypes.bool,
        additionalNodesInfo: PropTypes.object,
    };

    static defaultProps = {
        className: '',
        showSearch: true,
        showControls: true,
    };

    handleProblemFilterChange = (value) => {
        this.props.changeFilter(value);
    };

    handleUptimeFilterChange = (value) => {
        this.props.setNodesUptimeFilter(value);
    };

    renderControls() {
        const {nodes, searchQuery, handleSearchQuery, nodesUptimeFilter, problemFilter} =
            this.props;
        const nodesToShow = NodesViewer.selectNodesToShow(nodes, searchQuery);

        return (
            <div className={b('controls')}>
                <TextInput
                    className={b('search')}
                    size="s"
                    placeholder="Host name…"
                    value={searchQuery}
                    onUpdate={handleSearchQuery}
                    hasClear
                    autoFocus
                />
                <ProblemFilter value={problemFilter} onChange={this.handleProblemFilterChange} />
                <UptimeFilter value={nodesUptimeFilter} onChange={this.handleUptimeFilterChange} />
                <Label theme="info" size="m">{`Nodes: ${nodesToShow.length}`}</Label>
            </div>
        );
    }

    render() {
        const {
            className,
            searchQuery,
            path,
            problemFilter,
            showControls,
            hideTooltip,
            showTooltip,
            additionalNodesInfo = {},
            nodes,
        } = this.props;

        const columns = getNodesColumns({
            tabletsPath: path,
            hideTooltip,
            showTooltip,
            getNodeRef: additionalNodesInfo.getNodeRef,
        });

        const nodesToShow = NodesViewer.selectNodesToShow(nodes, searchQuery);

        return (
            <div className={`${b()} ${className}`}>
                {showControls ? this.renderControls() : null}
                <div className={b('table-wrapper')}>
                    {nodesToShow.length === 0 ? (
                        <Illustration name="thumbsUp" width="200" />
                    ) : (
                        <div className={b('table-content')}>
                            <DataTable
                                theme="yandex-cloud"
                                key={problemFilter}
                                data={nodesToShow}
                                columns={columns}
                                settings={DEFAULT_TABLE_SETTINGS}
                                emptyDataMessage="No such nodes"
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const {nodesUptimeFilter} = state.nodes;
    const {problemFilter} = state.settings;

    const nodes = filterNodesByStatusAndUptime(ownProps.nodes, problemFilter, nodesUptimeFilter);

    return {
        problemFilter,
        nodesUptimeFilter,
        nodes,
    };
};

const mapDispatchToProps = {
    changeFilter,
    hideTooltip,
    showTooltip,
    setNodesUptimeFilter,
};

const ConnectedNodesViewer = connect(mapStateToProps, mapDispatchToProps)(NodesViewer);
export default withSearch(ConnectedNodesViewer);
