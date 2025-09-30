import React from 'react';

import {ChevronsCollapseVertical, ChevronsExpandVertical} from '@gravity-ui/icons';
import {Button, Flex, Icon, Select, Text} from '@gravity-ui/uikit';
import {StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {VersionsBar} from '../../components/VersionsBar/VersionsBar';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import type {TClusterInfo} from '../../types/api/cluster';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval} from '../../utils/hooks';
import type {PreparedVersion, VersionsDataMap} from '../../utils/versions/types';

import {GroupedNodesTree} from './GroupedNodesTree/GroupedNodesTree';
import {getGroupedStorageNodes, getGroupedTenantNodes, getOtherNodes} from './groupNodes';
import i18n from './i18n';
import type {GroupedNodesItem} from './types';
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
                nodes={currentData?.nodes}
                versionsDataMap={versionsDataMap}
            />
        </LoaderWrapper>
    );
}

interface VersionsProps {
    nodes?: PreparedStorageNode[];
    preparedVersions: PreparedVersion[];
    versionsDataMap?: VersionsDataMap;
}

const groupByValueSchema = z.nativeEnum(GroupByValue).catch(GroupByValue.VERSION);

function Versions({preparedVersions, nodes, versionsDataMap}: VersionsProps) {
    const [{groupBy: rawGroupByValue}, setQueryParams] = useQueryParams({
        groupBy: StringParam,
    });

    const groupByValue = groupByValueSchema.parse(rawGroupByValue);

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

    const renderGroupControl = () => {
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
    };

    return (
        <Flex className={b()} direction={'column'} gap={6}>
            <Flex gap={3} direction={'column'} className={b('overall')}>
                <Text variant="subheader-3">{i18n('title_overall')}</Text>
                <VersionsBar preparedVersions={preparedVersions} size="m" />
            </Flex>

            <VersionsSection sectionTitle={i18n('title_storage-nodes')} nodes={storageNodes} />
            <VersionsSection
                sectionTitle={i18n('title_database-nodes')}
                nodes={tenantNodes}
                renderControls={renderGroupControl}
            />
            <VersionsSection sectionTitle={i18n('title_other-nodes')} nodes={otherNodes} />
        </Flex>
    );
}

function VersionsSection({
    sectionTitle,
    renderControls,
    nodes,
}: {
    sectionTitle: string;
    renderControls?: () => React.ReactNode;
    nodes?: GroupedNodesItem[];
}) {
    const [expanded, setExpanded] = React.useState(false);

    if (!nodes?.length) {
        return null;
    }

    const renderExpandButton = () => {
        return (
            <Button onClick={() => setExpanded((value) => !value)}>
                <Icon data={expanded ? ChevronsCollapseVertical : ChevronsExpandVertical} />
                {expanded ? i18n('action_collapse') : i18n('action_expand')}
            </Button>
        );
    };

    const renderNodes = () => {
        return nodes.map(
            ({
                title,
                isDatabase,
                nodes: itemNodes,
                items,
                versionColor,
                preparedVersions: nodesVersions,
            }) => (
                <GroupedNodesTree
                    key={title}
                    title={title}
                    isDatabase={isDatabase}
                    nodes={itemNodes}
                    items={items}
                    versionColor={versionColor}
                    expanded={expanded}
                    preparedVersions={nodesVersions}
                />
            ),
        );
    };

    return (
        <Flex gap={3} direction={'column'}>
            <Flex justifyContent={'space-between'}>
                <Flex gap={3}>
                    <Text variant="subheader-3">{sectionTitle}</Text>
                    {renderControls?.()}
                </Flex>
                {renderExpandButton()}
            </Flex>
            {renderNodes()}
        </Flex>
    );
}
