import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import _ from 'lodash';

import {Loader} from '@gravity-ui/uikit';
import ReactList from 'react-list';

import EntityStatus from '../../components/EntityStatus/EntityStatus';
import GroupTreeViewer from '../../components/GroupTreeViewer/GroupTreeViewer';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs';
import ProblemFilter, {problemFilterType} from '../../components/ProblemFilter/ProblemFilter';

import {getPoolInfo} from '../../store/reducers/pool';
import {AUTO_RELOAD_INTERVAL, ALL} from '../../utils/constants';
import {changeFilter} from '../../store/reducers/settings';

import './Pool.scss';

const b = cn('pool');

class Pool extends React.Component {
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
        getPoolInfo: PropTypes.func,
        pool: PropTypes.object,
        poolName: PropTypes.string,
        match: PropTypes.object,
        filter: problemFilterType,
        changeFilter: PropTypes.func,
    };

    static defaultProps = {
        pool: {},
    };

    static filterGroups(groups, filter) {
        return _.filter(groups, (item) => {
            return filter === ALL || (item.Overall && item.Overall !== 'Green');
        });
    }

    componentDidMount() {
        const {poolName} = this.props.match.params;
        this.props.getPoolInfo(decodeURIComponent(poolName));
        this.reloadDescriptor = setInterval(
            () => this.props.getPoolInfo(decodeURIComponent(poolName)),
            AUTO_RELOAD_INTERVAL,
        );
    }

    componentWillUnmount() {
        clearInterval(this.reloadDescriptor);
    }

    state = {
        extendedGroups: new Set(),
    };

    makeHandleGroupClick = (groupIndex) => () => {
        const {extendedGroups} = this.state;
        const newExtendedGroups = new Set([...extendedGroups]);

        if (newExtendedGroups.has(groupIndex)) {
            newExtendedGroups.delete(groupIndex);
        } else {
            newExtendedGroups.add(groupIndex);
        }

        this.setState({extendedGroups: newExtendedGroups});
    };

    makeRenderGroups = (groups) => (index, key) => {
        const group = groups[index];
        const {extendedGroups} = this.state;

        return (
            <GroupTreeViewer
                key={key}
                group={group}
                collapsed={!extendedGroups.has(index)}
                onClick={this.makeHandleGroupClick(index)}
            />
        );
    };

    renderContent = () => {
        const {pool, filter, changeFilter} = this.props;
        const {extendedGroups} = this.state;

        const breadcrumbsItems = [{text: 'Database'}, {text: 'Storage Pool'}];

        if (pool && pool.StoragePools) {
            const poolInfo = pool.StoragePools[0];
            const filteredGroups = Pool.filterGroups(poolInfo.Groups, filter);

            return (
                <div className={b()}>
                    <Breadcrumbs items={breadcrumbsItems} />
                    <div className={b('row')}>
                        <span className={b('title')}>Pool </span>
                        <EntityStatus status={poolInfo.Overall} name={poolInfo.Name}></EntityStatus>
                    </div>

                    <div className={b('controls')}>
                        <div className={b('title', {groups: true})}>Groups</div>
                        <ProblemFilter value={filter} onChange={changeFilter} />
                    </div>

                    {filteredGroups.length === 0 ? (
                        <div className="no-problem" />
                    ) : (
                        <ReactList
                            itemRenderer={this.makeRenderGroups(filteredGroups)}
                            length={filteredGroups.length}
                            itemSizeGetter={GroupTreeViewer.makeGetHeight(
                                filteredGroups,
                                extendedGroups,
                            )}
                            type="variable"
                        />
                    )}
                </div>
            );
        }
    };

    render() {
        const {loading, wasLoaded, error} = this.props;

        if (loading && !wasLoaded) {
            return Pool.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else {
            return this.renderContent();
        }
    }
}

const mapStateToProps = (state) => {
    const {data: pool, wasLoaded, loading, error} = state.pool;

    return {
        pool,
        wasLoaded,
        loading,
        error,
        filter: state.settings.problemFilter,
    };
};

const mapDispatchToProps = {
    getPoolInfo,
    changeFilter,
};

export default connect(mapStateToProps, mapDispatchToProps)(Pool);
