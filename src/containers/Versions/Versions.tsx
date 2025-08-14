import React from 'react';

import {ChevronsCollapseVertical, ChevronsExpandVertical} from '@gravity-ui/icons';
import {Button, Flex, Icon, SegmentedRadioGroup, Select, Text} from '@gravity-ui/uikit';
import {StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {VersionsBar} from '../../components/VersionsBar/VersionsBar';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {TClusterInfo} from '../../types/api/cluster';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval} from '../../utils/hooks';
import type {PreparedVersion, VersionsDataMap} from '../../utils/versions/types';

import {GroupedNodesTree} from './GroupedNodesTree/GroupedNodesTree';
import type {NodeType} from './constants';
import {NODE_TYPES, NODE_TYPES_TITLE} from './constants';
import {getGroupedStorageNodes, getGroupedTenantNodes, getOtherNodes} from './groupNodes';
import i18n from './i18n';
import {GroupByValue} from './types';
import {useGetPreparedVersions, useVersionsDataMap} from './utils';

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

    const preparedVersions = useGetPreparedVersions({
        cluster,
        versionsDataMap,
        clusterLoading: loading,
    });

    return (
        <LoaderWrapper loading={loading || isNodesLoading}>
            <Versions
                preparedVersions={preparedVersions}
                nodes={currentData?.Nodes}
                versionsDataMap={versionsDataMap}
            />
        </LoaderWrapper>
    );
}

interface VersionsProps {
    nodes?: NodesPreparedEntity[];
    preparedVersions: PreparedVersion[];
    versionsDataMap?: VersionsDataMap;
}

const nodeTypeSchema = z.nativeEnum(NODE_TYPES).catch(NODE_TYPES.storage);
const groupByValueSchema = z.nativeEnum(GroupByValue).catch(GroupByValue.VERSION);

function Versions({preparedVersions, nodes, versionsDataMap}: VersionsProps) {
    const [{nodeType: rawNodeType, groupBy: rawGroupByValue}, setQueryParams] = useQueryParams({
        nodeType: StringParam,
        groupBy: StringParam,
    });

    const nodeType = nodeTypeSchema.parse(rawNodeType);
    const groupByValue = groupByValueSchema.parse(rawGroupByValue);

    const [expanded, setExpanded] = React.useState(false);

    const tenantNodes = React.useMemo(() => {
        return getGroupedTenantNodes(nodes, versionsDataMap, groupByValue);
    }, [groupByValue, nodes, versionsDataMap]);
    const storageNodes = React.useMemo(() => {
        return getGroupedStorageNodes(nodes, versionsDataMap);
    }, [nodes, versionsDataMap]);
    const otherNodes = React.useMemo(() => {
        return getOtherNodes(nodes, versionsDataMap);
    }, [nodes, versionsDataMap]);

    const handleGroupByValueChange = (value: string) => {
        setQueryParams({groupBy: value as GroupByValue}, 'replaceIn');
    };
    const handleNodeTypeChange = (value: string) => {
        setQueryParams({nodeType: value as NodeType}, 'replaceIn');
    };

    const renderExpandButton = () => {
        return (
            <Button onClick={() => setExpanded((value) => !value)}>
                <Icon data={expanded ? ChevronsCollapseVertical : ChevronsExpandVertical} />
                {expanded ? i18n('action_collapse') : i18n('action_expand')}
            </Button>
        );
    };

    const renderNodeTypeRadio = () => {
        const options = [
            <SegmentedRadioGroup.Option value={NODE_TYPES.storage}>
                {NODE_TYPES_TITLE.storage}
            </SegmentedRadioGroup.Option>,
            <SegmentedRadioGroup.Option value={NODE_TYPES.database}>
                {NODE_TYPES_TITLE.database}
            </SegmentedRadioGroup.Option>,
        ];

        if (otherNodes?.length) {
            options.push(
                <SegmentedRadioGroup.Option value={NODE_TYPES.other}>
                    {NODE_TYPES_TITLE.other}
                </SegmentedRadioGroup.Option>,
            );
        }

        return (
            <SegmentedRadioGroup value={nodeType} onUpdate={handleNodeTypeChange}>
                {options}
            </SegmentedRadioGroup>
        );
    };

    const renderGroupControl = () => {
        if (nodeType === NODE_TYPES.database) {
            const options = [
                {value: GroupByValue.TENANT, content: i18n('title_database')},
                {value: GroupByValue.VERSION, content: i18n('title_version')},
            ];
            return (
                <Select
                    label={i18n('group-by')}
                    value={[groupByValue]}
                    options={options}
                    onUpdate={(values) => handleGroupByValueChange(values[0])}
                    width={200}
                    size="m"
                />
            );
        }
        return null;
    };
    const renderControls = () => {
        return (
            <Flex gap={3} className={b('controls')}>
                {renderNodeTypeRadio()}
                {renderGroupControl()}
                {renderExpandButton()}
            </Flex>
        );
    };

    const renderStorageNodes = () => {
        if (storageNodes?.length) {
            return storageNodes.map(({title, nodes: itemNodes, items, versionColor}) => (
                <GroupedNodesTree
                    key={`storage-nodes-${title}`}
                    title={title}
                    nodes={itemNodes}
                    items={items}
                    expanded={expanded}
                    versionColor={versionColor}
                />
            ));
        }
        return null;
    };
    const renderDatabaseNodes = () => {
        if (tenantNodes?.length) {
            return tenantNodes.map(
                ({
                    title,
                    isDatabase,
                    nodes: itemNodes,
                    items,
                    versionColor,
                    preparedVersions: nodesVersions,
                }) => (
                    <GroupedNodesTree
                        key={`tenant-nodes-${title}`}
                        title={title}
                        isDatabase={isDatabase}
                        nodes={itemNodes}
                        items={items}
                        expanded={expanded}
                        versionColor={versionColor}
                        preparedVersions={nodesVersions}
                    />
                ),
            );
        }
        return null;
    };

    const renderOtherNodes = () => {
        if (otherNodes?.length) {
            return otherNodes.map(
                ({
                    title,
                    nodes: itemNodes,
                    items,
                    versionColor,
                    preparedVersions: nodesVersions,
                }) => (
                    <GroupedNodesTree
                        key={`other-nodes-${title}`}
                        title={title}
                        nodes={itemNodes}
                        items={items}
                        versionColor={versionColor}
                        expanded={expanded}
                        preparedVersions={nodesVersions}
                    />
                ),
            );
        }
        return null;
    };

    const renderContent = () => {
        switch (nodeType) {
            case NODE_TYPES.storage:
                return renderStorageNodes();
            case NODE_TYPES.database:
                return renderDatabaseNodes();
            case NODE_TYPES.other:
                return renderOtherNodes();
            default:
                return null;
        }
    };

    const overallContent = (
        <Flex gap={3} direction={'column'} className={b('overall')}>
            <Text variant="subheader-3">{i18n('title_overall')}</Text>
            <VersionsBar preparedVersions={preparedVersions} size="m" />
        </Flex>
    );

    return (
        <div className={b()}>
            {overallContent}
            {renderControls()}
            <Flex direction={'column'} gap={3}>
                {renderContent()}
            </Flex>
        </div>
    );
}
