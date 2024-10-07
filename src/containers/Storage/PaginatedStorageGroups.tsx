import React from 'react';

import {ResponseError} from '../../components/Errors/ResponseError/ResponseError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import type {RenderControls} from '../../components/PaginatedTable';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerHasGrouping,
} from '../../store/reducers/capabilities/hooks';
import {storageApi} from '../../store/reducers/storage/storage';
import {useAutoRefreshInterval} from '../../utils/hooks';

import type {PaginatedStorageProps} from './PaginatedStorage';
import {StorageGroupsControls} from './StorageControls/StorageControls';
import {PaginatedStorageGroupsTable} from './StorageGroups/PaginatedStorageGroupsTable';
import {useStorageGroupsSelectedColumns} from './StorageGroups/columns/hooks';
import {TableGroup} from './TableGroup/TableGroup';
import {useExpandedGroups} from './TableGroup/useExpandedTableGroups';
import i18n from './i18n';
import {b, renderPaginatedTableErrorMessage} from './shared';
import {useStorageQueryParams} from './useStorageQueryParams';

import './Storage.scss';

export function PaginatedStorageGroups(props: PaginatedStorageProps) {
    const {storageGroupsGroupByParam, visibleEntities, handleShowAllGroups} =
        useStorageQueryParams();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const storageGroupsHandlerHasGroupping = useStorageGroupsHandlerHasGrouping();

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (storageGroupsHandlerHasGroupping && visibleEntities !== 'all') {
            handleShowAllGroups();
        }
    }, [handleShowAllGroups, storageGroupsHandlerHasGroupping, visibleEntities]);

    const renderContent = () => {
        if (storageGroupsHandlerHasGroupping && storageGroupsGroupByParam) {
            return <GroupedStorageGroupsComponent {...props} />;
        }

        return <StorageGroupsComponent {...props} />;
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
}

function StorageGroupsComponent({
    database,
    nodeId,
    groupId,
    pDiskId,
    viewContext,
    parentContainer,
    initialEntitiesCount,
}: PaginatedStorageProps) {
    const {searchValue, visibleEntities, handleShowAllGroups} = useStorageQueryParams();

    const {columnsToShow, columnsToSelect, setColumns} = useStorageGroupsSelectedColumns({
        visibleEntities,
        viewContext,
    });

    const renderControls: RenderControls = ({totalEntities, foundEntities, inited}) => {
        return (
            <StorageGroupsControls
                withTypeSelector
                withGroupBySelect
                entitiesCountCurrent={foundEntities}
                entitiesCountTotal={totalEntities}
                entitiesLoading={!inited}
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={setColumns}
            />
        );
    };

    return (
        <PaginatedStorageGroupsTable
            database={database}
            nodeId={nodeId}
            groupId={groupId}
            pDiskId={pDiskId}
            searchValue={searchValue}
            visibleEntities={visibleEntities}
            onShowAll={handleShowAllGroups}
            parentContainer={parentContainer}
            renderControls={renderControls}
            renderErrorMessage={renderPaginatedTableErrorMessage}
            columns={columnsToShow}
            initialEntitiesCount={initialEntitiesCount}
        />
    );
}

function GroupedStorageGroupsComponent({
    database,
    nodeId,
    groupId,
    pDiskId,

    viewContext,
}: PaginatedStorageProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {searchValue, storageGroupsGroupByParam, visibleEntities, handleShowAllGroups} =
        useStorageQueryParams();

    const {columnsToShow, columnsToSelect, setColumns} = useStorageGroupsSelectedColumns({
        visibleEntities,
        viewContext,
    });

    const {currentData, isFetching, error} = storageApi.useGetStorageGroupsInfoQuery(
        {
            database,
            with: 'all',
            nodeId,
            groupId,
            pDiskId,
            filter: searchValue,
            shouldUseGroupsHandler: true,
            group: storageGroupsGroupByParam,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const isLoading = currentData === undefined && isFetching;
    const {tableGroups, found = 0, total = 0} = currentData || {};

    const {expandedGroups, setIsGroupExpanded} = useExpandedGroups(tableGroups);

    const renderControls = () => {
        return (
            <StorageGroupsControls
                withTypeSelector
                withGroupBySelect
                entitiesCountCurrent={found}
                entitiesCountTotal={total}
                entitiesLoading={isLoading}
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={setColumns}
            />
        );
    };

    const renderGroups = () => {
        if (tableGroups?.length) {
            return tableGroups.map(({name, count}) => {
                const isExpanded = expandedGroups[name];

                return (
                    <TableGroup
                        key={name}
                        title={name}
                        count={count}
                        entityName={i18n('groups')}
                        expanded={isExpanded}
                        onIsExpandedChange={setIsGroupExpanded}
                    >
                        <PaginatedStorageGroupsTable
                            database={database}
                            nodeId={nodeId}
                            groupId={groupId}
                            pDiskId={pDiskId}
                            filterGroup={name}
                            filterGroupBy={storageGroupsGroupByParam}
                            searchValue={searchValue}
                            visibleEntities={'all'}
                            onShowAll={handleShowAllGroups}
                            renderErrorMessage={renderPaginatedTableErrorMessage}
                            columns={columnsToShow}
                            initialEntitiesCount={count}
                        />
                    </TableGroup>
                );
            });
        }

        return i18n('no-groups');
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            {error ? <ResponseError error={error} /> : null}
            <TableWithControlsLayout.Table loading={isLoading} className={b('groups-wrapper')}>
                {renderGroups()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}
