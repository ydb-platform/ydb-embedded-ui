import React from 'react';

import {ResponseError} from '../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import type {RenderControls} from '../../components/PaginatedTable';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    useCapabilitiesLoaded,
    useViewerNodesHandlerHasGrouping,
} from '../../store/reducers/capabilities/hooks';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import {useProblemFilter} from '../../store/reducers/settings/hooks';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {TableGroup} from '../Storage/TableGroup/TableGroup';
import {useExpandedGroups} from '../Storage/TableGroup/useExpandedTableGroups';

import {NodesControls} from './NodesControls/NodesControls';
import {PaginatedNodesTable} from './PaginatedNodesTable';
import {useNodesSelectedColumns} from './columns/hooks';
import i18n from './i18n';
import {b} from './shared';
import {useNodesPageQueryParams} from './useNodesPageQueryParams';

import './Nodes.scss';

interface PaginatedNodesProps {
    path?: string;
    database?: string;
    parentRef: React.RefObject<HTMLElement>;
    additionalNodesProps?: AdditionalNodesProps;
}

export function PaginatedNodes(props: PaginatedNodesProps) {
    const {uptimeFilter, groupByParam, handleUptimeFilterChange} = useNodesPageQueryParams();
    const {problemFilter, handleProblemFilterChange} = useProblemFilter();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (
            viewerNodesHandlerHasGrouping &&
            (problemFilter !== 'All' || uptimeFilter !== NodesUptimeFilterValues.All)
        ) {
            handleProblemFilterChange('All');
            handleUptimeFilterChange(NodesUptimeFilterValues.All);
        }
    }, [
        handleProblemFilterChange,
        handleUptimeFilterChange,
        problemFilter,
        uptimeFilter,
        viewerNodesHandlerHasGrouping,
    ]);

    const renderContent = () => {
        if (viewerNodesHandlerHasGrouping && groupByParam) {
            return <GroupedNodesComponent {...props} />;
        }

        return <NodesComponent {...props} />;
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
}

function NodesComponent({path, database, parentRef, additionalNodesProps}: PaginatedNodesProps) {
    const {searchValue, uptimeFilter} = useNodesPageQueryParams();
    const {problemFilter} = useProblemFilter();
    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();

    const {columnsToShow, columnsToSelect, setColumns} = useNodesSelectedColumns({
        getNodeRef: additionalNodesProps?.getNodeRef,
        database,
    });

    const renderControls: RenderControls = ({totalEntities, foundEntities, inited}) => {
        return (
            <NodesControls
                withGroupBySelect={viewerNodesHandlerHasGrouping}
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={setColumns}
                entitiesCountCurrent={foundEntities}
                entitiesCountTotal={totalEntities}
                entitiesLoading={!inited}
            />
        );
    };

    return (
        <PaginatedNodesTable
            path={path}
            database={database}
            searchValue={searchValue}
            problemFilter={problemFilter}
            uptimeFilter={uptimeFilter}
            columns={columnsToShow}
            parentRef={parentRef}
            renderControls={renderControls}
        />
    );
}

function GroupedNodesComponent({
    path,
    database,
    parentRef,
    additionalNodesProps,
}: PaginatedNodesProps) {
    const {searchValue, groupByParam} = useNodesPageQueryParams();
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {columnsToShow, columnsToSelect, setColumns} = useNodesSelectedColumns({
        getNodeRef: additionalNodesProps?.getNodeRef,
        database,
    });

    const {currentData, isFetching, error} = nodesApi.useGetNodesQuery(
        {
            path,
            database,
            filter: searchValue,
            group: groupByParam,
            limit: 0,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const isLoading = currentData === undefined && isFetching;
    const {
        NodeGroups: tableGroups,
        FoundNodes: found = 0,
        TotalNodes: total = 0,
    } = currentData || {};

    const {expandedGroups, setIsGroupExpanded} = useExpandedGroups(tableGroups);

    const renderControls = () => {
        return (
            <NodesControls
                withGroupBySelect
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={setColumns}
                entitiesCountCurrent={found}
                entitiesCountTotal={total}
                entitiesLoading={isLoading}
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
                        entityName={i18n('nodes')}
                        expanded={isExpanded}
                        onIsExpandedChange={setIsGroupExpanded}
                    >
                        <PaginatedNodesTable
                            path={path}
                            database={database}
                            searchValue={searchValue}
                            problemFilter={'All'}
                            uptimeFilter={NodesUptimeFilterValues.All}
                            filterGroup={name}
                            filterGroupBy={groupByParam}
                            initialEntitiesCount={count}
                            columns={columnsToShow}
                            parentRef={parentRef}
                        />
                    </TableGroup>
                );
            });
        }

        return i18n('no-nodes-groups');
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
