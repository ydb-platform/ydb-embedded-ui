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
import i18n from './i18n';
import {renderPaginatedTableErrorMessage} from './shared';
import {useStorageQueryParams} from './useStorageQueryParams';

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

function StorageGroupsComponent({database, nodeId, parentContainer}: PaginatedStorageProps) {
    const {searchValue, visibleEntities, handleShowAllGroups} = useStorageQueryParams();

    const {columnsToShow, columnsToSelect, setColumns} =
        useStorageGroupsSelectedColumns(visibleEntities);

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
            searchValue={searchValue}
            visibleEntities={visibleEntities}
            onShowAll={handleShowAllGroups}
            parentContainer={parentContainer}
            renderControls={renderControls}
            renderErrorMessage={renderPaginatedTableErrorMessage}
            columns={columnsToShow}
        />
    );
}

function GroupedStorageGroupsComponent({database, groupId, nodeId}: PaginatedStorageProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {searchValue, storageGroupsGroupByParam, visibleEntities, handleShowAllGroups} =
        useStorageQueryParams();

    const {columnsToShow, columnsToSelect, setColumns} =
        useStorageGroupsSelectedColumns(visibleEntities);

    const {currentData, isFetching, error} = storageApi.useGetStorageGroupsInfoQuery(
        {
            database,
            with: 'all',
            nodeId,
            groupId,
            shouldUseGroupsHandler: true,
            group: storageGroupsGroupByParam,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const isLoading = currentData === undefined && isFetching;
    const {tableGroups, found = 0, total = 0} = currentData || {};

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
        return tableGroups?.map(({name, count}) => {
            return (
                <TableGroup key={name} title={name} count={count} entityName={i18n('groups')}>
                    <PaginatedStorageGroupsTable
                        database={database}
                        nodeId={nodeId}
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
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            {error ? <ResponseError error={error} /> : null}
            <TableWithControlsLayout.Table loading={isLoading}>
                {renderGroups()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}
