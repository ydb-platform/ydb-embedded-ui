import {Selector, createSelector} from 'reselect';
import {escapeRegExp} from 'lodash';

import {EFlag} from '../../../types/api/enums';

import type {RootState} from '..';
import type {ProblemFilterValue} from '../settings/types';
import {ProblemFilterValues, selectProblemFilter} from '../settings/settings';

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

export const selectTenants = (state: TenantsStateSlice) => state.tenants.tenants;
export const selectTenantsSearchValue = (state: TenantsStateSlice) => state.tenants.searchValue;

// ==== Complex selectors ====

export const selectFilteredTenants: Selector<RootState, PreparedTenant[]> = createSelector(
    [selectTenants, selectProblemFilter, selectTenantsSearchValue],
    (tenants, problemFilter, searchQuery) => {
        let result = filterTenantsByProblems(tenants, problemFilter);
        result = filteredTenantsBySearch(result, searchQuery);

        return result;
    },
);
