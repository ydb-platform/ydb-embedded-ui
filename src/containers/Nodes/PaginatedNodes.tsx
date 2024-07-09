import React from 'react';

import {StringParam, useQueryParams} from 'use-query-params';

import {EntitiesCount} from '../../components/EntitiesCount';
import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Illustration} from '../../components/Illustration';
import {ResizeablePaginatedTable} from '../../components/PaginatedTable';
import type {
    FetchData,
    GetRowClassName,
    RenderControls,
    RenderErrorMessage,
} from '../../components/PaginatedTable';
import {ProblemFilter} from '../../components/ProblemFilter';
import {Search} from '../../components/Search';
import {UptimeFilter} from '../../components/UptimeFIlter';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import {
    ProblemFilterValues,
    changeFilter,
    selectProblemFilter,
} from '../../store/reducers/settings/settings';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import {cn} from '../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {
    NodesUptimeFilterValues,
    getProblemParamValue,
    getUptimeParamValue,
    isSortableNodesProperty,
    isUnavailableNode,
    nodesUptimeFilterValuesSchema,
} from '../../utils/nodes';
import type {NodesSortValue} from '../../utils/nodes';

import {getNodes} from './getNodes';
import {NODES_COLUMNS_WIDTH_LS_KEY, getNodesColumns} from './getNodesColumns';
import i18n from './i18n';

import './Nodes.scss';

const b = cn('ydb-nodes');

interface NodesProps {
    path?: string;
    parentContainer?: Element | null;
    additionalNodesProps?: AdditionalNodesProps;
}

export const PaginatedNodes = ({path, parentContainer, additionalNodesProps}: NodesProps) => {
    const [queryParams, setQueryParams] = useQueryParams({
        uptimeFilter: StringParam,
        search: StringParam,
    });
    const uptimeFilter = nodesUptimeFilterValuesSchema.parse(queryParams.uptimeFilter);
    const searchValue = queryParams.search ?? '';

    const dispatch = useTypedDispatch();

    const problemFilter = useTypedSelector(selectProblemFilter);

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
        const handleSearchQueryChange = (value: string) => {
            setQueryParams({search: value || undefined}, 'replaceIn');
        };

        const handleProblemFilterChange = (value: ProblemFilterValue) => {
            dispatch(changeFilter(value));
        };

        const handleUptimeFilterChange = (value: NodesUptimeFilterValues) => {
            setQueryParams({uptimeFilter: value}, 'replaceIn');
        };

        return (
            <React.Fragment>
                <Search
                    onChange={handleSearchQueryChange}
                    placeholder="Host name"
                    className={b('search')}
                    value={searchValue}
                />
                <ProblemFilter value={problemFilter} onChange={handleProblemFilterChange} />
                <UptimeFilter value={uptimeFilter} onChange={handleUptimeFilterChange} />
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

    const columns = rawColumns.map((column) => {
        return {...column, sortable: isSortableNodesProperty(column.name)};
    });

    return (
        <ResizeablePaginatedTable
            columnsWidthLSKey={NODES_COLUMNS_WIDTH_LS_KEY}
            parentContainer={parentContainer}
            columns={columns}
            fetchData={fetchData}
            limit={50}
            renderControls={renderControls}
            renderErrorMessage={renderErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            dependencyArray={filters}
            getRowClassName={getRowClassName}
        />
    );
};
