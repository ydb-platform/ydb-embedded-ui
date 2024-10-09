import React from 'react';

import {TableColumnSetup} from '@gravity-ui/uikit';
import {StringParam, useQueryParams} from 'use-query-params';

import {EntitiesCount} from '../../components/EntitiesCount';
import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Illustration} from '../../components/Illustration';
import {ResizeablePaginatedTable} from '../../components/PaginatedTable';
import type {
    GetRowClassName,
    RenderControls,
    RenderErrorMessage,
} from '../../components/PaginatedTable';
import {ProblemFilter} from '../../components/ProblemFilter';
import {Search} from '../../components/Search';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {NODES_COLUMNS_WIDTH_LS_KEY} from '../../components/nodesColumns/constants';
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
    isUnavailableNode,
    nodesUptimeFilterValuesSchema,
} from '../../utils/nodes';

import {useNodesSelectedColumns} from './columns/hooks';
import {getNodes} from './getNodes';
import i18n from './i18n';

import './Nodes.scss';

const b = cn('ydb-nodes');

interface NodesProps {
    path?: string;
    database?: string;
    parentRef?: React.RefObject<HTMLElement>;
    additionalNodesProps?: AdditionalNodesProps;
}

export const PaginatedNodes = ({path, database, parentRef, additionalNodesProps}: NodesProps) => {
    const [queryParams, setQueryParams] = useQueryParams({
        uptimeFilter: StringParam,
        search: StringParam,
    });
    const uptimeFilter = nodesUptimeFilterValuesSchema.parse(queryParams.uptimeFilter);
    const searchValue = queryParams.search ?? '';

    const dispatch = useTypedDispatch();

    const problemFilter = useTypedSelector(selectProblemFilter);

    const tableFilters = React.useMemo(() => {
        return {path, database, searchValue, problemFilter, uptimeFilter};
    }, [path, database, searchValue, problemFilter, uptimeFilter]);

    const {columnsToShow, columnsToSelect, setColumns} = useNodesSelectedColumns({
        getNodeRef: additionalNodesProps?.getNodeRef,
        database,
    });

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
                <TableColumnSetup
                    popupWidth={200}
                    items={columnsToSelect}
                    showStatus
                    onUpdate={setColumns}
                    sortable={false}
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

    return (
        <ResizeablePaginatedTable
            columnsWidthLSKey={NODES_COLUMNS_WIDTH_LS_KEY}
            parentRef={parentRef}
            columns={columnsToShow}
            fetchData={getNodes}
            limit={50}
            renderControls={renderControls}
            renderErrorMessage={renderErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            getRowClassName={getRowClassName}
            filters={tableFilters}
            tableName="nodes"
        />
    );
};
