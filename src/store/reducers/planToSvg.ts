import type {QueryPlan, ScriptPlan} from '../../types/api/query';

import {api} from './api';

export interface PlanToSvgQueryParams {
    plan: ScriptPlan | QueryPlan;
    database: string;
}

export const planToSvgApi = api.injectEndpoints({
    endpoints: (build) => ({
        planToSvgQuery: build.query<string, PlanToSvgQueryParams>({
            queryFn: async ({plan, database}, {signal}) => {
                try {
                    const response = await window.api.planToSvg(
                        {
                            database,
                            plan,
                        },
                        {signal},
                    );

                    return {data: response};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
