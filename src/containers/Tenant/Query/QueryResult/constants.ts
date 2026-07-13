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

interface ResultViewConfig {
    sections: SectionID[];
    defaultSection: SectionID;
}

const RESULT_VIEW_CONFIG: Record<QueryAction, ResultViewConfig> = {
    [QUERY_ACTIONS.execute]: {
        sections: [
            RESULT_OPTIONS_IDS.result,
            RESULT_OPTIONS_IDS.schema,
            RESULT_OPTIONS_IDS.simplified,
            RESULT_OPTIONS_IDS.stats,
        ],
        defaultSection: RESULT_OPTIONS_IDS.result,
    },
    [QUERY_ACTIONS.explain]: {
        sections: [
            RESULT_OPTIONS_IDS.schema,
            RESULT_OPTIONS_IDS.simplified,
            RESULT_OPTIONS_IDS.json,
            RESULT_OPTIONS_IDS.ast,
        ],
        defaultSection: RESULT_OPTIONS_IDS.schema,
    },
    [QUERY_ACTIONS.explainAnalyze]: {
        sections: [
            RESULT_OPTIONS_IDS.schema,
            RESULT_OPTIONS_IDS.simplified,
            RESULT_OPTIONS_IDS.stats,
        ],
        defaultSection: RESULT_OPTIONS_IDS.schema,
    },
};

export function getResultSections(resultType: QueryAction): SectionID[] {
    return RESULT_VIEW_CONFIG[resultType].sections;
}

export function getDefaultResultSection(resultType: QueryAction): SectionID {
    return RESULT_VIEW_CONFIG[resultType].defaultSection;
}
