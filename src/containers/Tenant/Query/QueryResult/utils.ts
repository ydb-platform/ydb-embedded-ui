import type {QueryResult} from '../../../../store/reducers/query/types';
import {STATISTICS_MODES_WITH_SVG, isExecutionQueryAction} from '../../../../utils/query';

export function canShowPlanToSvg(result: QueryResult): boolean {
    return Boolean(
        result.data?.plan &&
            result.statisticsMode &&
            STATISTICS_MODES_WITH_SVG.includes(result.statisticsMode) &&
            isExecutionQueryAction(result.type),
    );
}
