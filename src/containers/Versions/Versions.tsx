import React from 'react';

import {Checkbox, RadioButton} from '@gravity-ui/uikit';

import {Loader} from '../../components/Loader';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import type {TClusterInfo} from '../../types/api/cluster';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {VersionsBar} from '../Cluster/VersionsBar/VersionsBar';

import {GroupedNodesTree} from './GroupedNodesTree/GroupedNodesTree';
import {getGroupedStorageNodes, getGroupedTenantNodes, getOtherNodes} from './groupNodes';
import i18n from './i18n';
import {GroupByValue} from './types';
import {useGetVersionValues, useVersionToColorMap} from './utils';

import './Versions.scss';

const b = cn('ydb-versions');

interface VersionsProps {
    cluster?: TClusterInfo;
}

export const Versions = ({cluster}: VersionsProps) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const versionToColor = useVersionToColorMap();

    const versionsValues = useGetVersionValues(cluster, versionToColor);
    const {currentData, isLoading: isNodesLoading} = nodesApi.useGetNodesQuery(
        {tablets: false, fieldsRequired: ['SystemState']},
        {pollingInterval: autoRefreshInterval},
    );

    const nodes = currentData?.Nodes;
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
            <h4>{i18n('title_storage')}</h4>
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
            <h4>{i18n('title_database')}</h4>
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
            <h4>{i18n('title_other')}</h4>
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

    const overallContent = (
        <React.Fragment>
            <h4>{i18n('title_overall')}</h4>
            <div className={b('overall-wrapper')}>
                <VersionsBar
                    progressClassName={b('overall-progress')}
                    versionsValues={versionsValues.filter((el) => el.title !== 'unknown')}
                    size="m"
                />
            </div>
        </React.Fragment>
    );

    return (
        <div className={b()}>
            {overallContent}
            {storageNodesContent}
            {tenantNodesContent}
            {otherNodesContent}
        </div>
    );
};
