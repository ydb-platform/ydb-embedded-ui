import {StringParam, useQueryParams} from 'use-query-params';

import {AccessDenied} from '../../components/Errors/403/AccessDenied';
import {ResponseError} from '../../components/Errors/ResponseError/ResponseError';
import type {RenderControls, RenderErrorMessage} from '../../components/PaginatedTable';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {VISIBLE_ENTITIES} from '../../store/reducers/storage/constants';
import {storageTypeSchema, visibleEntitiesSchema} from '../../store/reducers/storage/types';
import type {StorageType, VisibleEntities} from '../../store/reducers/storage/types';
import {NodesUptimeFilterValues, nodesUptimeFilterValuesSchema} from '../../utils/nodes';
import {useAdditionalNodeProps} from '../AppWithClusters/useClusterData';

import {StorageControls} from './StorageControls/StorageControls';
import {PaginatedStorageGroups} from './StorageGroups/PaginatedStorageGroups';
import {useStorageGroupsSelectedColumns} from './StorageGroups/columns/hooks';
import {PaginatedStorageNodes} from './StorageNodes/PaginatedStorageNodes';
import {useStorageNodesSelectedColumns} from './StorageNodes/columns/hooks';

interface PaginatedStorageProps {
    database?: string;
    nodeId?: string;
    groupId?: string;
    parentContainer?: Element | null;
}

export const PaginatedStorage = ({
    database,
    nodeId,
    groupId,
    parentContainer,
}: PaginatedStorageProps) => {
    const {balancer} = useClusterBaseInfo();
    const additionalNodesProps = useAdditionalNodeProps({balancer});

    const [queryParams, setQueryParams] = useQueryParams({
        type: StringParam,
        visible: StringParam,
        search: StringParam,
        uptimeFilter: StringParam,
    });
    const storageType = storageTypeSchema.parse(queryParams.type);
    const isGroups = storageType === 'groups';
    const isNodes = storageType === 'nodes';

    const visibleEntities = visibleEntitiesSchema.parse(queryParams.visible);
    const searchValue = queryParams.search ?? '';
    const nodesUptimeFilter = nodesUptimeFilterValuesSchema.parse(queryParams.uptimeFilter);

    const {
        columnsToShow: storageNodesColumnsToShow,
        columnsToSelect: storageNodesColumnsToSelect,
        setColumns: setStorageNodesSelectedColumns,
    } = useStorageNodesSelectedColumns({
        additionalNodesProps,
        visibleEntities,
        database,
        groupId,
    });

    const {
        columnsToShow: storageGroupsColumnsToShow,
        columnsToSelect: storageGroupsColumnsToSelect,
        setColumns: setStorageGroupsSelectedColumns,
    } = useStorageGroupsSelectedColumns(visibleEntities);

    const handleTextFilterChange = (value: string) => {
        setQueryParams({search: value || undefined}, 'replaceIn');
    };

    const handleGroupVisibilityChange = (value: VisibleEntities) => {
        setQueryParams({visible: value}, 'replaceIn');
    };

    const handleStorageTypeChange = (value: StorageType) => {
        setQueryParams({type: value}, 'replaceIn');
    };

    const handleUptimeFilterChange = (value: NodesUptimeFilterValues) => {
        setQueryParams({uptimeFilter: value}, 'replaceIn');
    };

    const handleShowAllGroups = () => {
        handleGroupVisibilityChange(VISIBLE_ENTITIES.all);
    };

    const handleShowAllNodes = () => {
        setQueryParams(
            {
                visible: VISIBLE_ENTITIES.all,
                uptimeFilter: NodesUptimeFilterValues.All,
            },
            'replaceIn',
        );
    };

    const renderControls: RenderControls = ({totalEntities, foundEntities, inited}) => {
        const columnsToSelect = isGroups
            ? storageGroupsColumnsToSelect
            : storageNodesColumnsToSelect;

        const handleSelectedColumnsUpdate = isGroups
            ? setStorageGroupsSelectedColumns
            : setStorageNodesSelectedColumns;

        return (
            <StorageControls
                searchValue={searchValue}
                handleSearchValueChange={handleTextFilterChange}
                withTypeSelector
                storageType={storageType}
                handleStorageTypeChange={handleStorageTypeChange}
                visibleEntities={visibleEntities}
                handleVisibleEntitiesChange={handleGroupVisibilityChange}
                nodesUptimeFilter={nodesUptimeFilter}
                handleNodesUptimeFilterChange={handleUptimeFilterChange}
                withGroupsUsageFilter={false}
                entitiesCountCurrent={foundEntities}
                entitiesCountTotal={totalEntities}
                entitiesLoading={!inited}
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={handleSelectedColumnsUpdate}
            />
        );
    };

    const renderErrorMessage: RenderErrorMessage = (error) => {
        if (error.status === 403) {
            return <AccessDenied position="left" />;
        }

        return <ResponseError error={error} />;
    };

    if (isNodes) {
        return (
            <PaginatedStorageNodes
                searchValue={searchValue}
                visibleEntities={visibleEntities}
                nodesUptimeFilter={nodesUptimeFilter}
                database={database}
                onShowAll={handleShowAllNodes}
                parentContainer={parentContainer}
                renderControls={renderControls}
                renderErrorMessage={renderErrorMessage}
                columns={storageNodesColumnsToShow}
            />
        );
    }

    return (
        <PaginatedStorageGroups
            searchValue={searchValue}
            visibleEntities={visibleEntities}
            database={database}
            nodeId={nodeId}
            onShowAll={handleShowAllGroups}
            parentContainer={parentContainer}
            renderControls={renderControls}
            renderErrorMessage={renderErrorMessage}
            columns={storageGroupsColumnsToShow}
        />
    );
};
