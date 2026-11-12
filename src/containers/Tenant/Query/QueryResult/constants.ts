import type {ValueOf} from '../../../../types/common';
import type {QueryAction} from '../../../../types/store/query';
import {QUERY_ACTIONS} from '../../../../utils/query';

export const RESULT_OPTIONS_IDS = {
    result: 'result',
    queryPlan: 'query-plan',
    executionPlan: 'execution-plan',
    stats: 'stats',
    ast: 'ast',
} as const;

export type SectionID = ValueOf<typeof RESULT_OPTIONS_IDS>;

interface ResultViewConfig {
    sections: SectionID[];
    defaultSection: SectionID;
}

const RESULT_VIEW_CONFIG: Record<QueryAction, ResultViewConfig> = {
    [QUERY_ACTIONS.execute]: {
        sections: [
            RESULT_OPTIONS_IDS.result,
            RESULT_OPTIONS_IDS.queryPlan,
            RESULT_OPTIONS_IDS.executionPlan,
            RESULT_OPTIONS_IDS.stats,
        ],
        defaultSection: RESULT_OPTIONS_IDS.result,
    },
    [QUERY_ACTIONS.explain]: {
        sections: [
            RESULT_OPTIONS_IDS.queryPlan,
            RESULT_OPTIONS_IDS.executionPlan,
            RESULT_OPTIONS_IDS.ast,
        ],
        defaultSection: RESULT_OPTIONS_IDS.queryPlan,
    },
    [QUERY_ACTIONS.explainAnalyze]: {
        sections: [
            RESULT_OPTIONS_IDS.result,
            RESULT_OPTIONS_IDS.queryPlan,
            RESULT_OPTIONS_IDS.executionPlan,
            RESULT_OPTIONS_IDS.stats,
        ],
        defaultSection: RESULT_OPTIONS_IDS.queryPlan,
    },
};

export function getResultSections(resultType: QueryAction): SectionID[] {
    return RESULT_VIEW_CONFIG[resultType].sections;
}

export function getDefaultResultSection(resultType: QueryAction): SectionID {
    return RESULT_VIEW_CONFIG[resultType].defaultSection;
}

export function resolveResultSection(resultType: QueryAction, savedTab?: string): SectionID {
    return (
        getResultSections(resultType).find((section) => section === savedTab) ??
        getDefaultResultSection(resultType)
    );
}
