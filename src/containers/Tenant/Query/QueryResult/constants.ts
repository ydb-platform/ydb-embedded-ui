import type {ValueOf} from '../../../../types/common';
import type {QueryAction} from '../../../../types/store/query';
import {QUERY_ACTIONS} from '../../../../utils/query';

export const RESULT_OPTIONS_IDS = {
    result: 'result',
    schema: 'schema',
    simplified: 'simplified',
    json: 'json',
    stats: 'stats',
    ast: 'ast',
} as const;

export type SectionID = ValueOf<typeof RESULT_OPTIONS_IDS>;

const EXECUTE_SECTIONS: SectionID[] = [
    RESULT_OPTIONS_IDS.result,
    RESULT_OPTIONS_IDS.schema,
    RESULT_OPTIONS_IDS.simplified,
    RESULT_OPTIONS_IDS.stats,
];

const EXPLAIN_SECTIONS: SectionID[] = [
    RESULT_OPTIONS_IDS.schema,
    RESULT_OPTIONS_IDS.simplified,
    RESULT_OPTIONS_IDS.json,
    RESULT_OPTIONS_IDS.ast,
];

const EXPLAIN_ANALYZE_SECTIONS: SectionID[] = [
    RESULT_OPTIONS_IDS.schema,
    RESULT_OPTIONS_IDS.simplified,
    RESULT_OPTIONS_IDS.stats,
];

export function isExecutionResultType(resultType: QueryAction) {
    return resultType === QUERY_ACTIONS.execute;
}

export function getResultSections(resultType: QueryAction): SectionID[] {
    if (resultType === QUERY_ACTIONS.execute) {
        return EXECUTE_SECTIONS;
    }
    if (resultType === QUERY_ACTIONS.explainAnalyze) {
        return EXPLAIN_ANALYZE_SECTIONS;
    }
    return EXPLAIN_SECTIONS;
}

export function getDefaultResultSection(resultType: QueryAction): SectionID {
    return resultType === QUERY_ACTIONS.execute
        ? RESULT_OPTIONS_IDS.result
        : RESULT_OPTIONS_IDS.schema;
}
