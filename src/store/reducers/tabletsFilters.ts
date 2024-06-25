import {createSelector, lruMemoize} from '@reduxjs/toolkit';
import {shallowEqual} from 'react-redux';

import type {TTabletStateInfo} from '../../types/api/tablet';
import type {TabletsApiRequestParams} from '../../types/store/tablets';
import type {RootState} from '../defaultStore';

import {selectGetTabletsInfo} from './tablets';

const EMPTY_ARRAY: TTabletStateInfo[] = [];

export const getFilteredTablets = createSelector(
    (state: RootState, params: TabletsApiRequestParams) =>
        selectGetTabletsInfo(state, params)?.TabletStateInfo,
    (_: RootState, _params: TabletsApiRequestParams, stateFilter: string[]) => stateFilter,
    (
        _: RootState,
        _params: TabletsApiRequestParams,
        _stateFilter: string[],
        typeFilter: string[],
    ) => typeFilter,
    (tablets, stateFilter, typeFilter) => {
        let filteredTablets = tablets ?? EMPTY_ARRAY;

        if (typeFilter.length > 0) {
            filteredTablets = filteredTablets?.filter((tblt) =>
                typeFilter.some((filter) => tblt.Type === filter),
            );
        }
        if (stateFilter.length > 0) {
            filteredTablets = filteredTablets?.filter((tblt) =>
                stateFilter.some((filter) => tblt.State === filter),
            );
        }

        return filteredTablets.length > 0 ? filteredTablets : EMPTY_ARRAY;
    },
    {
        argsMemoize: lruMemoize,
        argsMemoizeOptions: {
            equalityCheck: shallowEqual,
        },
    },
);
