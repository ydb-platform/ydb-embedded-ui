import {useState} from 'react';
import block from 'bem-cn-lite';

import {Checkbox, RadioButton} from '@gravity-ui/uikit';

import type {PreparedClusterNode} from '../../store/reducers/clusterNodes/types';
import type {VersionToColorMap} from '../../types/versions';
import {getGroupedStorageNodes, getGroupedTenantNodes, getOtherNodes} from './groupNodes';
import {GroupedNodesTree} from './GroupedNodesTree/GroupedNodesTree';
import {GroupByValue} from './types';

import './Versions.scss';

const b = block('ydb-versions');

interface VersionsProps {
    nodes?: PreparedClusterNode[];
    versionToColor?: VersionToColorMap;
}

export const Versions = ({nodes = [], versionToColor}: VersionsProps) => {
    const [groupByValue, setGroupByValue] = useState<GroupByValue>(GroupByValue.VERSION);
    const [expanded, setExpanded] = useState(false);

    const handleGroupByValueChange = (value: string) => {
        setGroupByValue(value as GroupByValue);
    };

    const renderGroupControl = () => {
        return (
            <div className={b('group')}>
                <span className={b('label')}>Group by:</span>
                <RadioButton value={groupByValue} onUpdate={handleGroupByValueChange}>
                    <RadioButton.Option value={GroupByValue.TENANT}>
                        {GroupByValue.TENANT}
                    </RadioButton.Option>
                    <RadioButton.Option value={GroupByValue.VERSION}>
                        {GroupByValue.VERSION}
                    </RadioButton.Option>
                </RadioButton>
            </div>
        );
    };
    const renderControls = () => {
        return (
            <div className={b('controls')}>
                {renderGroupControl()}
                <Checkbox
                    className={b('checkbox')}
                    onChange={() => setExpanded((value) => !value)}
                    checked={expanded}
                >
                    All expanded
                </Checkbox>
            </div>
        );
    };
    const renderGroupedNodes = () => {
        const tenantNodes = getGroupedTenantNodes(nodes, versionToColor, groupByValue);
        const storageNodes = getGroupedStorageNodes(nodes, versionToColor);
        const otherNodes = getOtherNodes(nodes, versionToColor);
        const storageNodesContent = storageNodes?.length ? (
            <>
                <h3>Storage nodes</h3>
                {storageNodes.map(({title, nodes: itemNodes, items, versionColor}, index) => (
                    <GroupedNodesTree
                        key={`storage-nodes-${index}`}
                        title={title}
                        nodes={itemNodes}
                        items={items}
                        versionColor={versionColor}
                    />
                ))}
            </>
        ) : null;
        const tenantNodesContent = tenantNodes?.length ? (
            <>
                <h3>Database nodes</h3>
                {renderControls()}
                {tenantNodes.map(
                    ({title, nodes: itemNodes, items, versionColor, versionsValues}, index) => (
                        <GroupedNodesTree
                            key={`tenant-nodes-${index}`}
                            title={title}
                            nodes={itemNodes}
                            items={items}
                            expanded={expanded}
                            versionColor={versionColor}
                            versionsValues={versionsValues}
                        />
                    ),
                )}
            </>
        ) : null;
        const otherNodesContent = otherNodes?.length ? (
            <>
                <h3>Other nodes</h3>
                {otherNodes.map(
                    ({title, nodes: itemNodes, items, versionColor, versionsValues}, index) => (
                        <GroupedNodesTree
                            key={`other-nodes-${index}`}
                            title={title}
                            nodes={itemNodes}
                            items={items}
                            versionColor={versionColor}
                            versionsValues={versionsValues}
                        />
                    ),
                )}
            </>
        ) : null;
        return (
            <div className={b('versions')}>
                {storageNodesContent}
                {tenantNodesContent}
                {otherNodesContent}
            </div>
        );
    };
    return <div className={b('content')}>{renderGroupedNodes()}</div>;
};
