import React from 'react';

import type {SelectOption} from '@gravity-ui/uikit';
import {Loader, Select} from '@gravity-ui/uikit';
import map from 'lodash/map';
import {Helmet} from 'react-helmet-async';
import ReactList from 'react-list';
import {ArrayParam, StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Tablet} from '../../components/Tablet';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {nodesListApi} from '../../store/reducers/nodesList';
import {tabletsApi} from '../../store/reducers/tablets';
import {getFilteredTablets} from '../../store/reducers/tabletsFilters';
import type {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import {AUTO_RELOAD_INTERVAL, CLUSTER_DEFAULT_TITLE} from '../../utils/constants';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {tabletColorToTabletState, tabletStates} from '../../utils/tablet';

import i18n from './i18n';

import './TabletsFilters.scss';

const b = cn('tablets-filters');

const stringArrayParam = z.preprocess((arg) => {
    if (Array.isArray(arg)) {
        return arg.filter(Boolean).sort();
    }
    return [];
}, z.string().array());

const stateArrayParam = z.preprocess((arg) => {
    if (Array.isArray(arg)) {
        return arg
            .flatMap((item) => tabletColorToTabletState[item as EFlag] || item)
            .filter(Boolean);
    }
    return [];
}, z.string().array());

const CONTROL_WIDTH = 220;
const POPUP_WIDTH = 300;

export function TabletsFilters() {
    const [params, setParams] = useQueryParams({
        nodeIds: ArrayParam,
        type: ArrayParam,
        state: ArrayParam,
        path: StringParam,
        clusterName: StringParam,
    });

    const path = params.path ?? undefined;
    const dispatch = useTypedDispatch();
    React.useEffect(() => {
        dispatch(
            setHeaderBreadcrumbs('tablets', {
                tenantName: path,
            }),
        );
    }, [dispatch, path]);

    const nodeIds = stringArrayParam.parse(params.nodeIds);

    const {currentData, isFetching, error} = tabletsApi.useGetTabletsInfoQuery(
        {nodes: nodeIds, path},
        {
            pollingInterval: AUTO_RELOAD_INTERVAL,
        },
    );

    const {data: nodes} = nodesListApi.useGetNodesListQuery(
        {},
        {pollingInterval: AUTO_RELOAD_INTERVAL},
    );

    const loading = isFetching && currentData === undefined;

    const stateFilter = stateArrayParam.parse(params.state);
    const states = tabletStates.map((item) => ({value: item, content: item}));
    const typeFilter = stringArrayParam.parse(params.type);
    const types = Array.from(
        new Set(...[map(currentData?.TabletStateInfo, (tblt) => tblt.Type)]),
    ).map((item) => ({
        value: String(item),
        content: item,
    }));

    const filteredTablets = useTypedSelector((state) =>
        getFilteredTablets(state, {nodes: nodeIds, path}, stateFilter, typeFilter),
    );

    const renderTablet = (index: number, key: string) => (
        <Tablet tablet={filteredTablets[index]} tenantName={path} key={key} />
    );

    const nodesForSelect = map(nodes, (node) => ({
        content: node.Id,
        value: String(node.Id),
        data: node.Host,
    }));

    const renderView = () => {
        if (loading) {
            return (
                <div className={'loader'}>
                    <Loader size="l" />
                </div>
            );
        }
        if (error && typeof error === 'object' && 'status' in error && error.status === 403) {
            return <AccessDenied />;
        }
        return (
            <div className={b()}>
                {path ? (
                    <div className={b('tenant')}>
                        <span className={b('label')}>Database: </span> {path}
                    </div>
                ) : null}
                <Filters
                    nodesForSelect={nodesForSelect}
                    nodeFilter={nodeIds}
                    onChangeNodes={(n) => setParams({nodeIds: n})}
                    states={states}
                    stateFilter={stateFilter}
                    onChangeStates={(s) => setParams({state: s})}
                    types={types}
                    typeFilter={typeFilter}
                    onChangeTypes={(t) => setParams({type: t})}
                />

                {error ? <ResponseError error={error} /> : null}

                {filteredTablets.length > 0 ? (
                    <div className={b('items')}>
                        <ReactList
                            itemRenderer={renderTablet}
                            length={filteredTablets.length}
                            type="uniform"
                        />
                    </div>
                ) : (
                    !error && <div className={b('empty-message')}>no tablets</div>
                )}
            </div>
        );
    };

    return (
        <React.Fragment>
            <Helmet>
                <title>{`${i18n('page.title')} — ${
                    path || params.clusterName || CLUSTER_DEFAULT_TITLE
                }`}</title>
            </Helmet>
            {renderView()}
        </React.Fragment>
    );
}

interface TabletFilterProps {
    nodesForSelect: SelectOption[];
    nodeFilter: string[];
    onChangeNodes: (nodes: string[]) => void;

    states: SelectOption[];
    stateFilter: string[];
    onChangeStates: (states: string[]) => void;

    types: SelectOption[];
    typeFilter: string[];
    onChangeTypes: (types: string[]) => void;
}

function Filters({
    nodesForSelect,
    nodeFilter,
    onChangeNodes,

    states,
    stateFilter,
    onChangeStates,

    types,
    typeFilter,
    onChangeTypes,
}: TabletFilterProps) {
    return (
        <div className={b('filters')}>
            <div className={b('filter-wrapper')}>
                <Select
                    multiple
                    label="Node ID"
                    width={CONTROL_WIDTH}
                    popupWidth={POPUP_WIDTH}
                    placeholder="All"
                    options={nodesForSelect}
                    value={nodeFilter}
                    onUpdate={onChangeNodes}
                    renderOption={(option) => {
                        return (
                            <div className={b('node')}>
                                <div>{option.content}</div>
                                <div className={b('node-meta')} title={option.data}>
                                    {option.data}
                                </div>
                            </div>
                        );
                    }}
                    getOptionHeight={() => 40}
                />
            </div>

            <div className={b('filter-wrapper')}>
                <Select
                    multiple
                    label="multiple"
                    width={CONTROL_WIDTH}
                    placeholder="All"
                    options={states}
                    value={stateFilter}
                    onUpdate={onChangeStates}
                />
            </div>

            <div className={b('filter-wrapper')}>
                <Select
                    multiple
                    label="Types"
                    width={CONTROL_WIDTH}
                    placeholder="All"
                    options={types}
                    value={typeFilter}
                    onUpdate={onChangeTypes}
                />
            </div>
        </div>
    );
}
