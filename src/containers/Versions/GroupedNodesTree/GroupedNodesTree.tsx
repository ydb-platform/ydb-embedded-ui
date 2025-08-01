import React from 'react';

import {TreeView} from 'ydb-ui-components';

import type {NodesPreparedEntity} from '../../../store/reducers/nodes/types';
import {cn} from '../../../utils/cn';
import type {VersionValue} from '../../../utils/versions/types';
import {NodesTable} from '../NodesTable/NodesTable';
import {NodesTreeTitle} from '../NodesTreeTitle/NodesTreeTitle';
import type {GroupedNodesItem} from '../types';

import './GroupedNodesTree.scss';

const b = cn('ydb-versions-grouped-node-tree');

interface GroupedNodesTreeProps {
    title?: string;
    nodes?: NodesPreparedEntity[];
    items?: GroupedNodesItem[];
    expanded?: boolean;
    versionColor?: string;
    versionsValues?: VersionValue[];
    level?: number;
}

export const GroupedNodesTree = ({
    title,
    nodes,
    items,
    expanded = false,
    versionColor,
    versionsValues,
    level = 0,
}: GroupedNodesTreeProps) => {
    const [isOpened, toggleBlock] = React.useState(false);

    React.useEffect(() => {
        toggleBlock(expanded);
    }, [expanded]);

    const groupTitle = (
        <NodesTreeTitle
            title={title}
            nodes={nodes}
            items={items}
            versionColor={versionColor}
            versionsValues={versionsValues}
        />
    );

    const toggleCollapsed = () => {
        toggleBlock((value) => !value);
    };

    if (items) {
        return (
            <div className={b({'first-level': level === 0})}>
                <TreeView
                    key={title}
                    name={groupTitle}
                    collapsed={!isOpened}
                    hasArrow={true}
                    onClick={toggleCollapsed}
                    onArrowClick={toggleCollapsed}
                >
                    {items.map((item, index) => (
                        <GroupedNodesTree
                            key={index}
                            title={item.title}
                            nodes={item.nodes}
                            expanded={expanded}
                            versionColor={item.versionColor}
                            level={level + 1}
                        />
                    ))}
                </TreeView>
            </div>
        );
    }

    return (
        <div className={b({'first-level': level === 0})}>
            <TreeView
                key={title}
                name={groupTitle}
                collapsed={!isOpened}
                hasArrow
                onClick={toggleCollapsed}
                onArrowClick={toggleCollapsed}
            >
                <div className={b('dt-wrapper')}>
                    <NodesTable nodes={nodes || []} />
                </div>
            </TreeView>
        </div>
    );
};
