import React from 'react';

import type {NodesPreparedEntity} from '../../../store/reducers/nodes/types';
import {cn} from '../../../utils/cn';
import type {PreparedVersion} from '../../../utils/versions/types';
import {NodesTable} from '../NodesTable/NodesTable';
import {NodesTreeTitle} from '../NodesTreeTitle/NodesTreeTitle';
import {VersionsBlock} from '../VersionsBlock/VersionsBlock';
import type {GroupedNodesItem} from '../types';

import './GroupedNodesTree.scss';

const b = cn('ydb-versions-grouped-node-tree');

interface GroupedNodesTreeProps {
    title?: string;
    isDatabase?: boolean;
    nodes?: NodesPreparedEntity[];
    items?: GroupedNodesItem[];
    expanded?: boolean;
    versionColor?: string;
    preparedVersions?: PreparedVersion[];
}

export const GroupedNodesTree = ({
    title,
    isDatabase,
    nodes,
    items,
    expanded = false,
    versionColor,
    preparedVersions,
}: GroupedNodesTreeProps) => {
    const [isOpened, setIsOpened] = React.useState(false);

    React.useEffect(() => {
        setIsOpened(expanded);
    }, [expanded]);

    const toggleCollapsed = () => {
        setIsOpened((value) => !value);
    };

    const renderHeader = () => {
        return (
            <NodesTreeTitle
                title={title}
                isDatabase={isDatabase}
                expanded={isOpened}
                nodes={nodes}
                items={items}
                versionColor={versionColor}
                preparedVersions={preparedVersions}
                onClick={toggleCollapsed}
            />
        );
    };

    const renderItemsContent = () => {
        return items?.map((item, index) => (
            <GroupedNodesTree
                key={index}
                title={item.title}
                isDatabase={item.isDatabase}
                nodes={item.nodes}
                expanded={expanded}
                versionColor={item.versionColor}
                preparedVersions={item.preparedVersions}
            />
        ));
    };

    const renderNodesContent = () => {
        return <NodesTable nodes={nodes || []} />;
    };

    const renderContent = () => {
        if (items) {
            return renderItemsContent();
        }
        return renderNodesContent();
    };

    return (
        <div className={b('wrapper')}>
            <VersionsBlock
                expanded={isOpened}
                renderHeader={renderHeader}
                renderContent={renderContent}
            />
        </div>
    );
};
