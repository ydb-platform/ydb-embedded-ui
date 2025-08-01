import React from 'react';

import {Checkbox, SegmentedRadioGroup} from '@gravity-ui/uikit';

import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {TClusterInfo} from '../../types/api/cluster';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval} from '../../utils/hooks';
import type {VersionValue, VersionsDataMap} from '../../utils/versions/types';
import {VersionsBar} from '../Cluster/VersionsBar/VersionsBar';

import {GroupedNodesTree} from './GroupedNodesTree/GroupedNodesTree';
import {getGroupedStorageNodes, getGroupedTenantNodes, getOtherNodes} from './groupNodes';
import i18n from './i18n';
import {GroupByValue} from './types';
import {useGetVersionValues, useVersionsDataMap} from './utils';

import './Versions.scss';

const b = cn('ydb-versions');

interface VersionsContainerProps {
    cluster?: TClusterInfo;
    loading?: boolean;
}

export function VersionsContainer({cluster, loading}: VersionsContainerProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isLoading: isNodesLoading} = nodesApi.useGetNodesQuery(
        {tablets: false, fieldsRequired: ['SystemState', 'SubDomainKey']},
        {pollingInterval: autoRefreshInterval},
    );
    const versionsDataMap = useVersionsDataMap(cluster);

    const versionsValues = useGetVersionValues({cluster, versionsDataMap, clusterLoading: loading});

    return (
        <LoaderWrapper loading={loading || isNodesLoading}>
            <Versions
                versionsValues={versionsValues}
                nodes={currentData?.Nodes}
                versionsDataMap={versionsDataMap}
            />
        </LoaderWrapper>
    );
}

interface VersionsProps {
    nodes?: NodesPreparedEntity[];
    versionsValues: VersionValue[];
    versionsDataMap?: VersionsDataMap;
}

function Versions({versionsValues, nodes, versionsDataMap}: VersionsProps) {
    const [groupByValue, setGroupByValue] = React.useState<GroupByValue>(GroupByValue.VERSION);
    const [expanded, setExpanded] = React.useState(false);

    const handleGroupByValueChange = (value: string) => {
        setGroupByValue(value as GroupByValue);
    };

    const renderGroupControl = () => {
        return (
            <div className={b('group')}>
                <span className={b('label')}>Group by:</span>
                <SegmentedRadioGroup value={groupByValue} onUpdate={handleGroupByValueChange}>
                    <SegmentedRadioGroup.Option value={GroupByValue.TENANT}>
                        {GroupByValue.TENANT}
                    </SegmentedRadioGroup.Option>
                    <SegmentedRadioGroup.Option value={GroupByValue.VERSION}>
                        {GroupByValue.VERSION}
                    </SegmentedRadioGroup.Option>
                </SegmentedRadioGroup>
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

    const tenantNodes = getGroupedTenantNodes(nodes, versionsDataMap, groupByValue);
    const storageNodes = getGroupedStorageNodes(nodes, versionsDataMap);
    const otherNodes = getOtherNodes(nodes, versionsDataMap);
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
}
