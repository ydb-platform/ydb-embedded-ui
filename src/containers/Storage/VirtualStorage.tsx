import {useState} from 'react';

import type {AdditionalNodesProps} from '../../types/additionalProps';
import type {RenderControls, RenderErrorMessage} from '../../components/VirtualTable';
import type {StorageType, VisibleEntities} from '../../store/reducers/storage/types';
import {STORAGE_TYPES, VISIBLE_ENTITIES} from '../../store/reducers/storage/constants';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {AccessDenied} from '../../components/Errors/403/AccessDenied';
import {ResponseError} from '../../components/Errors/ResponseError/ResponseError';

import {StorageControls} from './StorageControls/StorageControls';
import {VirtualStorageGroups} from './StorageGroups/VirtualStorageGroups';
import {VirtualStorageNodes} from './StorageNodes/VirtualStorageNodes';
import {useClusterNodesMap} from '../../contexts/ClusterNodesMapContext/ClusterNodesMapContext';

interface VirtualStorageProps {
    tenant?: string;
    nodeId?: string;
    parentContainer?: Element | null;
    additionalNodesProps?: AdditionalNodesProps;
}

export const VirtualStorage = ({
    tenant,
    nodeId,
    parentContainer,
    additionalNodesProps,
}: VirtualStorageProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [storageType, setStorageType] = useState<StorageType>(STORAGE_TYPES.groups);
    const [visibleEntities, setVisibleEntities] = useState<VisibleEntities>(VISIBLE_ENTITIES.all);
    const [nodesUptimeFilter, setNodesUptimeFilter] = useState<NodesUptimeFilterValues>(
        NodesUptimeFilterValues.All,
    );

    const nodesMap = useClusterNodesMap();

    const handleShowAllGroups = () => {
        setVisibleEntities(VISIBLE_ENTITIES.all);
    };

    const handleShowAllNodes = () => {
        setVisibleEntities(VISIBLE_ENTITIES.all);
        setNodesUptimeFilter(NodesUptimeFilterValues.All);
    };

    const renderControls: RenderControls = ({totalEntities, foundEntities, inited}) => {
        return (
            <StorageControls
                searchValue={searchValue}
                handleSearchValueChange={setSearchValue}
                withTypeSelector={!nodeId}
                storageType={storageType}
                handleStorageTypeChange={setStorageType}
                visibleEntities={visibleEntities}
                handleVisibleEntitiesChange={setVisibleEntities}
                nodesUptimeFilter={nodesUptimeFilter}
                handleNodesUptimeFilterChange={setNodesUptimeFilter}
                withGroupsUsageFilter={false}
                entitiesCountCurrent={foundEntities}
                entitiesCountTotal={totalEntities}
                entitiesLoading={!inited}
            />
        );
    };

    const renderErrorMessage: RenderErrorMessage = (error) => {
        if (error.status === 403) {
            return <AccessDenied position="left" />;
        }

        return <ResponseError error={error} />;
    };

    if (storageType === STORAGE_TYPES.nodes) {
        return (
            <VirtualStorageNodes
                searchValue={searchValue}
                visibleEntities={visibleEntities}
                nodesUptimeFilter={nodesUptimeFilter}
                tenant={tenant}
                additionalNodesProps={additionalNodesProps}
                onShowAll={handleShowAllNodes}
                parentContainer={parentContainer}
                renderControls={renderControls}
                renderErrorMessage={renderErrorMessage}
            />
        );
    }

    return (
        <VirtualStorageGroups
            searchValue={searchValue}
            visibleEntities={visibleEntities}
            tenant={tenant}
            nodeId={nodeId}
            nodesMap={nodesMap}
            onShowAll={handleShowAllGroups}
            parentContainer={parentContainer}
            renderControls={renderControls}
            renderErrorMessage={renderErrorMessage}
        />
    );
};
