import {useState, useEffect} from 'react';
import cn from 'bem-cn-lite';

import {TreeView} from 'ydb-ui-components';

import type {PreparedClusterNode} from '../../../store/reducers/clusterNodes/types';
import type {VersionValue} from '../../../types/versions';

import type {GroupedNodesItem} from '../types';
import {NodesTreeTitle} from '../NodesTreeTitle/NodesTreeTitle';
import {NodesTable} from '../NodesTable/NodesTable';

import './GroupedNodesTree.scss';

export const b = cn('ydb-versions-grouped-node-tree');

interface GroupedNodesTreeProps {
    title?: string;
    nodes?: PreparedClusterNode[];
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
    const [isOpened, toggleBlock] = useState(false);

    useEffect(() => {
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
