import React from 'react';

import {VirtualTable} from '../../../components/VirtualTable';
import type {FetchData, RenderControls, RenderErrorMessage} from '../../../components/VirtualTable';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {PreparedStorageNode, VisibleEntities} from '../../../store/reducers/storage/types';
import type {AdditionalNodesProps} from '../../../types/additionalProps';
import {NodesUptimeFilterValues, getUptimeParamValue} from '../../../utils/nodes';
import type {NodesSortValue} from '../../../utils/nodes';

import {StorageNodesEmptyDataMessage} from './StorageNodesEmptyDataMessage';
import {getStorageNodes} from './getNodes';
import {getPreparedStorageNodesColumns} from './getStorageNodesColumns';
import i18n from './i18n';
import {getRowUnavailableClassName} from './shared';

interface VirtualStorageNodesProps {
    searchValue: string;
    visibleEntities: VisibleEntities;
    nodesUptimeFilter: NodesUptimeFilterValues;
    tenant?: string;

    additionalNodesProps?: AdditionalNodesProps;
    onShowAll: VoidFunction;

    parentContainer?: Element | null;
    renderControls: RenderControls;
    renderErrorMessage: RenderErrorMessage;
}

export const VirtualStorageNodes = ({
    searchValue,
    visibleEntities,
    nodesUptimeFilter,
    tenant,
    additionalNodesProps,
    onShowAll,
    parentContainer,
    renderControls,
    renderErrorMessage,
}: VirtualStorageNodesProps) => {
    const filters = React.useMemo(() => {
        return [searchValue, visibleEntities, nodesUptimeFilter, tenant];
    }, [searchValue, visibleEntities, nodesUptimeFilter, tenant]);

    const fetchData = React.useCallback<FetchData<PreparedStorageNode>>(
        async (limit, offset, {sortOrder, columnId} = {}) => {
            return await getStorageNodes({
                limit,
                offset,
                filter: searchValue,
                uptime: getUptimeParamValue(nodesUptimeFilter),
                visibleEntities,
                tenant,

                sortOrder,
                sortValue: columnId as NodesSortValue,
            });
        },
        [nodesUptimeFilter, searchValue, tenant, visibleEntities],
    );

    const columns = React.useMemo(() => {
        return getPreparedStorageNodesColumns(additionalNodesProps, visibleEntities);
    }, [additionalNodesProps, visibleEntities]);

    const renderEmptyDataMessage = () => {
        if (
            visibleEntities !== VISIBLE_ENTITIES.all ||
            nodesUptimeFilter !== NodesUptimeFilterValues.All
        ) {
            return (
                <StorageNodesEmptyDataMessage
                    onShowAll={onShowAll}
                    nodesUptimeFilter={nodesUptimeFilter}
                    visibleEntities={visibleEntities}
                />
            );
        }

        return i18n('empty.default');
    };

    return (
        <VirtualTable
            parentContainer={parentContainer}
            columns={columns}
            fetchData={fetchData}
            rowHeight={50}
            limit={50}
            renderControls={renderControls}
            renderErrorMessage={renderErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            getRowClassName={getRowUnavailableClassName}
            dependencyArray={filters}
        />
    );
};
