import React from 'react';

import {Checkbox, RadioButton} from '@gravity-ui/uikit';

import {Loader} from '../../components/Loader';
import {clusterNodesApi} from '../../store/reducers/clusterNodes/clusterNodes';
import type {VersionToColorMap} from '../../types/versions';
import {cn} from '../../utils/cn';

import {GroupedNodesTree} from './GroupedNodesTree/GroupedNodesTree';
import {getGroupedStorageNodes, getGroupedTenantNodes, getOtherNodes} from './groupNodes';
import {GroupByValue} from './types';

import './Versions.scss';

const b = cn('ydb-versions');

interface VersionsProps {
    versionToColor?: VersionToColorMap;
}

export const Versions = ({versionToColor}: VersionsProps) => {
    const {data: nodes = [], isLoading: isNodesLoading} = clusterNodesApi.useGetClusterNodesQuery(
        undefined,
        {pollingInterval: 30_000},
    );

    const [groupByValue, setGroupByValue] = React.useState<GroupByValue>(GroupByValue.VERSION);
    const [expanded, setExpanded] = React.useState(false);

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

    if (isNodesLoading) {
        return <Loader />;
    }

    const tenantNodes = getGroupedTenantNodes(nodes, versionToColor, groupByValue);
    const storageNodes = getGroupedStorageNodes(nodes, versionToColor);
    const otherNodes = getOtherNodes(nodes, versionToColor);
    const storageNodesContent = storageNodes?.length ? (
        <React.Fragment>
            <h3>Storage nodes</h3>
            {storageNodes.map(({title, nodes: itemNodes, items, versionColor}) => (
                <GroupedNodesTree
                    key={`storage-nodes-${title}`}
                    title={title}
                    nodes={itemNodes}
                    items={items}
                    versionColor={versionColor}
                />
            ))}
        </React.Fragment>
    ) : null;
    const tenantNodesContent = tenantNodes?.length ? (
        <React.Fragment>
            <h3>Database nodes</h3>
            {renderControls()}
            {tenantNodes.map(({title, nodes: itemNodes, items, versionColor, versionsValues}) => (
                <GroupedNodesTree
                    key={`tenant-nodes-${title}`}
                    title={title}
                    nodes={itemNodes}
                    items={items}
                    expanded={expanded}
                    versionColor={versionColor}
                    versionsValues={versionsValues}
                />
            ))}
        </React.Fragment>
    ) : null;
    const otherNodesContent = otherNodes?.length ? (
        <React.Fragment>
            <h3>Other nodes</h3>
            {otherNodes.map(({title, nodes: itemNodes, items, versionColor, versionsValues}) => (
                <GroupedNodesTree
                    key={`other-nodes-${title}`}
                    title={title}
                    nodes={itemNodes}
                    items={items}
                    versionColor={versionColor}
                    versionsValues={versionsValues}
                />
            ))}
        </React.Fragment>
    ) : null;

    return (
        <div className={b('versions')}>
            {storageNodesContent}
            {tenantNodesContent}
            {otherNodesContent}
        </div>
    );
};
