import type {ExecuteResponse, ExplainResponse} from '../../../types/api/query';
import {parseQueryAPIResponse} from '../../../utils/query';

import {preparePlanData} from './preparePlanData';
import type {PreparedQueryData} from './types';

export function prepareQueryData(
    response: ExplainResponse | ExecuteResponse | null,
): PreparedQueryData {
    const result = parseQueryAPIResponse(response);
    const {plan: rawPlan, stats} = result;

    const {simplifiedPlan, ...planData} = preparePlanData(rawPlan, stats);
    return {
        ...result,
        preparedPlan: Object.keys(planData).length > 0 ? planData : undefined,
        simplifiedPlan,
    };
}
