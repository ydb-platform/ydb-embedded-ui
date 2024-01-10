import {useCallback, useMemo} from 'react';

import type {AdditionalNodesProps} from '../../../types/additionalProps';
import {
    getUptimeParamValue,
    NodesUptimeFilterValues,
    type NodesSortValue,
} from '../../../utils/nodes';
import {
    VirtualTable,
    type FetchData,
    type RenderControls,
    type RenderErrorMessage,
} from '../../../components/VirtualTable';
import type {PreparedStorageNode, VisibleEntities} from '../../../store/reducers/storage/types';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';

import {StorageNodesEmptyDataMessage} from './StorageNodesEmptyDataMessage';
import {getPreparedStorageNodesColumns} from './getStorageNodesColumns';
import {getStorageNodes} from './getNodes';
import {getRowUnavailableClassName} from './shared';
import i18n from './i18n';

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
    const filters = useMemo(() => {
        return [searchValue, visibleEntities, nodesUptimeFilter, tenant];
    }, [searchValue, visibleEntities, nodesUptimeFilter, tenant]);

    const fetchData = useCallback<FetchData<PreparedStorageNode>>(
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

    const columns = useMemo(() => {
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
