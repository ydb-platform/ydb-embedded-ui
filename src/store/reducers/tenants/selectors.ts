import {createSelector} from '@reduxjs/toolkit';
import escapeRegExp from 'lodash/escapeRegExp';

import type {RootState} from '../..';
import {EFlag} from '../../../types/api/enums';
import {ProblemFilterValues, selectProblemFilter} from '../settings/settings';
import type {ProblemFilterValue} from '../settings/types';

import {tenantsApi} from './tenants';
import type {PreparedTenant, TenantsStateSlice} from './types';

// ==== Filters ====

const filterTenantsByProblems = (tenants: PreparedTenant[], problemFilter: ProblemFilterValue) => {
    if (problemFilter === ProblemFilterValues.ALL) {
        return tenants;
    }

    return tenants.filter((tenant) => {
        return tenant.Overall && tenant.Overall !== EFlag.Green;
    });
};

const filteredTenantsBySearch = (tenants: PreparedTenant[], searchQuery: string) => {
    return tenants.filter((item) => {
        const re = new RegExp(escapeRegExp(searchQuery), 'i');
        return re.test(item.Name || '') || re.test(item.controlPlaneName);
    });
};

// ==== Simple selectors ====
const createGetTenantsInfoSelector = createSelector(
    (clusterName: string | undefined) => clusterName,
    (clusterName) => tenantsApi.endpoints.getTenantsInfo.select({clusterName}),
);

export const selectTenants = createSelector(
    (state: RootState) => state,
    (_state: RootState, clusterName: string | undefined) =>
        createGetTenantsInfoSelector(clusterName),
    (state: RootState, selectTenantsInfo) => selectTenantsInfo(state).data ?? [],
);
export const selectTenantsSearchValue = (state: TenantsStateSlice) => state.tenants.searchValue;

// ==== Complex selectors ====

export const selectFilteredTenants = createSelector(
    [selectTenants, selectProblemFilter, selectTenantsSearchValue],
    (tenants, problemFilter, searchQuery) => {
        let result = filterTenantsByProblems(tenants, problemFilter);
        result = filteredTenantsBySearch(result, searchQuery);

        return result;
    },
);
