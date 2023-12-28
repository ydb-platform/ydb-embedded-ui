import {useCallback, useMemo, useState} from 'react';
import cn from 'bem-cn-lite';

import type {AdditionalNodesProps} from '../../types/additionalProps';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import {ProblemFilterValues} from '../../store/reducers/settings/settings';
import {
    NodesSortValue,
    NodesUptimeFilterValues,
    getProblemParamValue,
    getUptimeParamValue,
    isSortableNodesProperty,
    isUnavailableNode,
} from '../../utils/nodes';

import {Search} from '../../components/Search';
import {ProblemFilter} from '../../components/ProblemFilter';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {EntitiesCount} from '../../components/EntitiesCount';
import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Illustration} from '../../components/Illustration';
import {
    type FetchData,
    type RenderControls,
    type RenderErrorMessage,
    VirtualTable,
    GetRowClassName,
} from '../../components/VirtualTable';

import {getNodesColumns} from './getNodesColumns';
import {getNodes} from './getNodes';
import i18n from './i18n';

import './Nodes.scss';

const b = cn('ydb-nodes');

interface NodesProps {
    parentContainer?: Element | null;
    additionalNodesProps?: AdditionalNodesProps;
}

export const VirtualNodes = ({parentContainer, additionalNodesProps}: NodesProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [problemFilter, setProblemFilter] = useState<ProblemFilterValue>(ProblemFilterValues.ALL);
    const [uptimeFilter, setUptimeFilter] = useState<NodesUptimeFilterValues>(
        NodesUptimeFilterValues.All,
    );

    const filters = useMemo(() => {
        return [searchValue, problemFilter, uptimeFilter];
    }, [searchValue, problemFilter, uptimeFilter]);

    const fetchData = useCallback<FetchData<NodesPreparedEntity>>(
        async (limit, offset, {sortOrder, columnId} = {}) => {
            return await getNodes({
                limit,
                offset,
                filter: searchValue,
                problems_only: getProblemParamValue(problemFilter),
                uptime: getUptimeParamValue(uptimeFilter),
                sortOrder,
                sortValue: columnId as NodesSortValue,
            });
        },
        [problemFilter, searchValue, uptimeFilter],
    );

    const getRowClassName: GetRowClassName<NodesPreparedEntity> = (row) => {
        return b('node', {unavailable: isUnavailableNode(row)});
    };

    const renderControls: RenderControls = ({totalEntities, foundEntities, inited}) => {
        return (
            <>
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
            </>
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
            return <AccessDenied />;
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
        />
    );
};
