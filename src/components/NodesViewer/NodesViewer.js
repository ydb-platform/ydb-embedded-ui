import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {connect} from 'react-redux';

import {TextInput, Label} from '@gravity-ui/uikit';
import DataTable from '@yandex-cloud/react-data-table';

import ProblemFilter, {problemFilterType} from '../ProblemFilter/ProblemFilter';

import {withSearch} from '../../HOCS';
import {calcUptime} from '../../utils';
import {ALL, DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {changeFilter} from '../../store/reducers/settings';
import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import {getNodesColumns} from '../../utils/getNodesColumns';

import {Illustration} from '../Illustration';

import './NodesViewer.scss';

const b = cn('nodes-viewer');

class NodesViewer extends React.PureComponent {
    static propTypes = {
        nodes: PropTypes.array.isRequired,
        className: PropTypes.string,
        searchQuery: PropTypes.string,
        handleSearchQuery: PropTypes.func,
        showTooltip: PropTypes.func,
        hideTooltip: PropTypes.func,
        filter: problemFilterType,
        changeFilter: PropTypes.func,
        showControls: PropTypes.bool,
        additionalNodesInfo: PropTypes.object,
    };

    static defaultProps = {
        className: '',
        showSearch: true,
        showControls: true,
    };

    state = {
        filteredNodes: [],
        nodesToShow: [],
    };

    static getDerivedStateFromProps(props, state) {
        const {nodes, filter} = props;
        if (!_.isEqual(nodes, state.nodes)) {
            return {
                nodes,
                filteredNodes: NodesViewer.filterNodes(nodes, filter),
            };
        }
        return null;
    }

    static filterNodes(nodes, filter) {
        if (filter === ALL) {
            return nodes;
        }

        return _.filter(nodes, (node) => {
            return node.Overall && node.Overall !== 'Green';
        });
    }

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

    onChangeProblemFilter = (filter) => {
        const {nodes, changeFilter} = this.props;
        const filteredNodes = NodesViewer.filterNodes(nodes, filter);

        changeFilter(filter);
        this.setState({filteredNodes});
    };

    renderControls() {
        const {searchQuery, handleSearchQuery, filter} = this.props;
        const nodesToShow = NodesViewer.selectNodesToShow(this.state.filteredNodes, searchQuery);

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
                <ProblemFilter value={filter} onChange={this.onChangeProblemFilter} />
                <Label theme="info" size="m">{`Nodes: ${nodesToShow.length}`}</Label>
            </div>
        );
    }

    render() {
        const {
            className,
            searchQuery,
            path,
            filter,
            showControls,
            hideTooltip,
            showTooltip,
            additionalNodesInfo = {},
        } = this.props;
        const {filteredNodes = []} = this.state;

        const columns = getNodesColumns({
            tabletsPath: path,
            hideTooltip,
            showTooltip,
            getNodeRef: additionalNodesInfo.getNodeRef,
        });

        const nodesToShow = NodesViewer.selectNodesToShow(filteredNodes, searchQuery);

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
                                key={filter}
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

const mapStateToProps = (state) => {
    return {
        filter: state.settings.problemFilter,
    };
};

const mapDispatchToProps = {
    changeFilter,
    hideTooltip,
    showTooltip,
};

const ConnectedNodesViewer = connect(mapStateToProps, mapDispatchToProps)(NodesViewer);
export default withSearch(ConnectedNodesViewer);
