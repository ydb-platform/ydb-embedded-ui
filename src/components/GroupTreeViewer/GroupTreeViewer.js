import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {withRouter} from 'react-router';

import GroupViewer from '../GroupViewer/GroupViewer';
import PDiskViewer from '../PDiskViewer/PDiskViewer';
import EntityStatus from '../EntityStatus/EntityStatus';
import TreeView from '../TreeView/TreeView';
import {stringifyVdiskId} from '../../utils';
import routes, {createHref} from '../../routes';
import {backend} from '../../store';

import './GroupTreeViewer.scss';

const b = cn('group-tree-viewer');

class GroupTreeViewer extends React.Component {
    static propTypes = {
        group: PropTypes.object.isRequired,
        collapsed: PropTypes.bool,
        onClick: PropTypes.func,
    };

    static ITEM_HEIGHT_COLLAPSED = 38;
    static GROUP_ITEM_HEIGHT = 34;

    static makeGetHeight = (groups, extendedGroups) => (index) => {
        const {VDisks} = groups[index];
        const countVDisks = VDisks?.length;
        const parentHeight = GroupTreeViewer.ITEM_HEIGHT_COLLAPSED;
        const childHeight = GroupTreeViewer.GROUP_ITEM_HEIGHT;

        if (extendedGroups.has(index)) {
            return parentHeight + countVDisks * childHeight;
        }

        return parentHeight;
    };

    render() {
        const {group, collapsed, onClick} = this.props;
        const label2 = (
            <div>
                <GroupViewer key={group.GroupID} group={group} />
            </div>
        );
        if (group && Object.keys(group).length) {
            return (
                <div className={b()}>
                    <TreeView
                        key={group.GroupID}
                        nodeLabel={label2}
                        collapsed={collapsed}
                        onClick={onClick}
                    >
                        {group.VDisks?.map((disk, diskIndex) => (
                            <div key={diskIndex} className={b('row')}>
                                <EntityStatus
                                    className={b('disk')}
                                    status={disk.Overall}
                                    name={stringifyVdiskId(disk.VDiskId)}
                                    label="VDiskID"
                                    path={createHref(routes.vdisk, null, {
                                        vdiskId: stringifyVdiskId(disk.VDiskId),
                                    })}
                                />

                                <PDiskViewer
                                    className={b('disk')}
                                    disk={disk.PDisk}
                                    key={disk.Guid}
                                    backend={backend}
                                />
                            </div>
                        ))}
                    </TreeView>
                </div>
            );
        } else {
            return <div className={b()}>No data</div>;
        }
    }
}

export default withRouter(GroupTreeViewer);
