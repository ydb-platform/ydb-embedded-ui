import React from 'react';

import {EntitiesCount} from '../../components/EntitiesCount';
import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Illustration} from '../../components/Illustration';
import {ProblemFilter} from '../../components/ProblemFilter';
import {Search} from '../../components/Search';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {VirtualTable} from '../../components/VirtualTable';
import type {
    FetchData,
    GetRowClassName,
    RenderControls,
    RenderErrorMessage,
} from '../../components/VirtualTable';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import {ProblemFilterValues} from '../../store/reducers/settings/settings';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import {cn} from '../../utils/cn';
import {updateColumnsWidth, useTableResize} from '../../utils/hooks/useTableResize';
import {
    NodesUptimeFilterValues,
    getProblemParamValue,
    getUptimeParamValue,
    isSortableNodesProperty,
    isUnavailableNode,
} from '../../utils/nodes';
import type {NodesSortValue} from '../../utils/nodes';

import {getNodes} from './getNodes';
import {getNodesColumns} from './getNodesColumns';
import i18n from './i18n';

import './Nodes.scss';

const b = cn('ydb-nodes');

interface NodesProps {
    path?: string;
    parentContainer?: Element | null;
    additionalNodesProps?: AdditionalNodesProps;
}

export const VirtualNodes = ({path, parentContainer, additionalNodesProps}: NodesProps) => {
    const [searchValue, setSearchValue] = React.useState('');
    const [problemFilter, setProblemFilter] = React.useState<ProblemFilterValue>(
        ProblemFilterValues.ALL,
    );
    const [uptimeFilter, setUptimeFilter] = React.useState<NodesUptimeFilterValues>(
        NodesUptimeFilterValues.All,
    );

    const [tableColumnsWidthSetup, setTableColumnsWidth] = useTableResize('nodesTableColumnsWidth');

    const filters = React.useMemo(() => {
        return [path, searchValue, problemFilter, uptimeFilter];
    }, [path, searchValue, problemFilter, uptimeFilter]);

    const fetchData = React.useCallback<FetchData<NodesPreparedEntity>>(
        async (limit, offset, {sortOrder, columnId} = {}) => {
            return await getNodes({
                limit,
                offset,
                path,
                filter: searchValue,
                problems_only: getProblemParamValue(problemFilter),
                uptime: getUptimeParamValue(uptimeFilter),
                sortOrder,
                sortValue: columnId as NodesSortValue,
            });
        },
        [path, problemFilter, searchValue, uptimeFilter],
    );

    const getRowClassName: GetRowClassName<NodesPreparedEntity> = (row) => {
        return b('node', {unavailable: isUnavailableNode(row)});
    };

    const renderControls: RenderControls = ({totalEntities, foundEntities, inited}) => {
        return (
            <React.Fragment>
                <Search
                    onChange={setSearchValue}
                    placeholder="Host name"
                    className={b('search')}
                    value={searchValue}
                />
                <ProblemFilter value={problemFilter} onChange={setProblemFilter} />
                <UptimeFilter value={uptimeFilter} onChange={setUptimeFilter} />
                <EntitiesCount
                    total={totalEntities}
                    current={foundEntities}
                    label={'Nodes'}
                    loading={!inited}
                />
            </React.Fragment>
        );
    };

    const renderEmptyDataMessage = () => {
        if (
            problemFilter !== ProblemFilterValues.ALL ||
            uptimeFilter !== NodesUptimeFilterValues.All
        ) {
            return <Illustration name="thumbsUp" width="200" />;
        }

        return i18n('empty.default');
    };

    const renderErrorMessage: RenderErrorMessage = (error) => {
        if (error && error.status === 403) {
            return <AccessDenied position="left" />;
        }

        return <ResponseError error={error} />;
    };

    const rawColumns = getNodesColumns({
        getNodeRef: additionalNodesProps?.getNodeRef,
    });

    const columns = updateColumnsWidth(rawColumns, tableColumnsWidthSetup).map((column) => {
        return {...column, sortable: isSortableNodesProperty(column.name)};
    });

    return (
        <VirtualTable
            parentContainer={parentContainer}
            columns={columns}
            fetchData={fetchData}
            limit={50}
            renderControls={renderControls}
            renderErrorMessage={renderErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            dependencyArray={filters}
            getRowClassName={getRowClassName}
            onColumnsResize={setTableColumnsWidth}
        />
    );
};
