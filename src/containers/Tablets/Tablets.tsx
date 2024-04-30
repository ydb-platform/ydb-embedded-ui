import React from 'react';

import {Select} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import ReactList from 'react-list';

import {Loader} from '../../components/Loader';
import {Tablet} from '../../components/Tablet';
import TabletsOverall from '../../components/TabletsOverall/TabletsOverall';
import {setStateFilter, setTypeFilter, tabletsApi} from '../../store/reducers/tablets';
import type {ETabletState, EType} from '../../types/api/tablet';
import type {TabletsApiRequestParams} from '../../types/store/tablets';
import {cn} from '../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import i18n from './i18n';

import './Tablets.scss';

const b = cn('tablets');

interface TabletsProps {
    path?: string;
    nodeId?: string | number;
    className?: string;
}

export const Tablets = ({path, nodeId, className}: TabletsProps) => {
    const dispatch = useTypedDispatch();

    const {stateFilter, typeFilter} = useTypedSelector((state) => state.tablets);
    const {autorefresh} = useTypedSelector((state) => state.schema);

    let params: TabletsApiRequestParams | typeof skipToken = skipToken;
    if (nodeId) {
        params = {nodes: [String(nodeId)]};
    } else if (path) {
        params = {path};
    }
    const {currentData, isFetching, error} = tabletsApi.useGetTabletsInfoQuery(params, {
        pollingInterval: autorefresh,
    });

    const loading = isFetching && currentData === undefined;
    const tablets = React.useMemo(() => currentData?.TabletStateInfo || [], [currentData]);

    const tabletsToRender = React.useMemo(() => {
        let filteredTablets = tablets;

        if (typeFilter.length > 0) {
            filteredTablets = filteredTablets.filter((tablet) =>
                typeFilter.some((filter) => tablet.Type === filter),
            );
        }
        if (stateFilter.length > 0) {
            filteredTablets = filteredTablets.filter((tablet) =>
                stateFilter.some((filter) => tablet.State === filter),
            );
        }
        return filteredTablets;
    }, [tablets, stateFilter, typeFilter]);

    const handleStateFilterChange = (value: string[]) => {
        dispatch(setStateFilter(value as ETabletState[]));
    };

    const handleTypeFilterChange = (value: string[]) => {
        dispatch(setTypeFilter(value as EType[]));
    };

    const renderTablet = (tabletIndex: number) => {
        return <Tablet tablet={tabletsToRender[tabletIndex]} key={tabletIndex} />;
    };

    const renderContent = () => {
        const states = Array.from(new Set(tablets.map((tablet) => tablet.State)))
            .filter((state): state is ETabletState => state !== undefined)
            .map((item) => ({
                value: item,
                content: item,
            }));
        const types = Array.from(new Set(tablets.map((tablet) => tablet.Type)))
            .filter((type): type is EType => type !== undefined)
            .map((item) => ({
                value: item,
                content: item,
            }));

        return (
            <div className={b(null, className)}>
                <div className={b('header')}>
                    <Select
                        className={b('filter-control')}
                        multiple
                        placeholder={i18n('controls.allItems')}
                        label={`${i18n('controls.state')}:`}
                        options={states}
                        value={stateFilter}
                        onUpdate={handleStateFilterChange}
                    />
                    <Select
                        className={b('filter-control')}
                        multiple
                        placeholder={i18n('controls.allItems')}
                        label={`${i18n('controls.type')}:`}
                        options={types}
                        value={typeFilter}
                        onUpdate={handleTypeFilterChange}
                    />
                    <TabletsOverall tablets={tablets} />
                </div>

                <div className={b('items')}>
                    <ReactList
                        itemRenderer={renderTablet}
                        length={tabletsToRender.length}
                        type="uniform"
                    />
                </div>
            </div>
        );
    };

    if (loading) {
        return <Loader />;
    } else if (error) {
        return <div className="error">{error.statusText}</div>;
    } else {
        return tablets.length > 0 ? (
            renderContent()
        ) : (
            <div className="error">{i18n('noTabletsData')}</div>
        );
    }
};
