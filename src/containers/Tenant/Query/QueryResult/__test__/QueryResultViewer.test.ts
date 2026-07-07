import {QUERY_ACTIONS} from '../../../../../utils/query';
import {RESULT_OPTIONS_IDS, getDefaultResultSection, getResultSections} from '../constants';

describe('QueryResultViewer result sections', () => {
    test('keeps execute result sections unchanged', () => {
        expect(getResultSections(QUERY_ACTIONS.execute)).toEqual([
            RESULT_OPTIONS_IDS.result,
            RESULT_OPTIONS_IDS.schema,
            RESULT_OPTIONS_IDS.simplified,
            RESULT_OPTIONS_IDS.stats,
        ]);
        expect(getDefaultResultSection(QUERY_ACTIONS.execute)).toBe(RESULT_OPTIONS_IDS.result);
    });

    test('keeps explain result sections unchanged', () => {
        expect(getResultSections(QUERY_ACTIONS.explain)).toEqual([
            RESULT_OPTIONS_IDS.schema,
            RESULT_OPTIONS_IDS.simplified,
            RESULT_OPTIONS_IDS.json,
            RESULT_OPTIONS_IDS.ast,
        ]);
        expect(getDefaultResultSection(QUERY_ACTIONS.explain)).toBe(RESULT_OPTIONS_IDS.schema);
    });

    test('shows plan and stats sections for explain analyze without result tab', () => {
        expect(getResultSections(QUERY_ACTIONS.explainAnalyze)).toEqual([
            RESULT_OPTIONS_IDS.schema,
            RESULT_OPTIONS_IDS.simplified,
            RESULT_OPTIONS_IDS.stats,
        ]);
        expect(getResultSections(QUERY_ACTIONS.explainAnalyze)).not.toContain(
            RESULT_OPTIONS_IDS.result,
        );
        expect(getDefaultResultSection(QUERY_ACTIONS.explainAnalyze)).toBe(
            RESULT_OPTIONS_IDS.schema,
        );
    });
});
