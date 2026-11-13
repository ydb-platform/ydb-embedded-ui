import {prepareQueryData} from '../../../../../store/reducers/query/parsers/prepareQueryData';
import type {SimplifiedNode} from '../../../../../types/api/query';
import {getDefaultResultSection, getResultSections, resolveResultSection} from '../constants';
import {getInitialQueryPlanView} from '../utils';

describe('QueryResultViewer result sections', () => {
    test.each([
        ['execute', ['result', 'query-plan', 'execution-plan', 'stats'], 'result'],
        ['explain', ['query-plan', 'execution-plan', 'ast'], 'query-plan'],
        ['explain-analyze', ['result', 'query-plan', 'execution-plan', 'stats'], 'query-plan'],
    ] as const)('shows the result views for %s', (action, sections, initial) => {
        expect(getResultSections(action)).toEqual(sections);
        expect(getDefaultResultSection(action)).toBe(initial);
    });
});

test.each(['schema', 'simplified', 'json', 'unknown'])(
    'falls back for obsolete view %s',
    (saved) => {
        expect(resolveResultSection('explain', saved)).toBe('query-plan');
        expect(resolveResultSection('execute', saved)).toBe('result');
    },
);

test.each<[string, SimplifiedNode | undefined, string]>([
    ['0.2', undefined, 'graph'],
    ['0.2', {'Node Type': 'Query', Plans: []}, 'graph'],
    ['0.2', {'Node Type': 'Scan', Operators: [{Name: 'Scan'}]}, 'table'],
    ['0.3', undefined, 'json'],
])('prepares v%s with simplified plan %j as %s', (version, SimplifiedPlan, expected) => {
    const data = prepareQueryData({
        plan: {
            meta: {version, type: 'query'},
            Plan: {'Node Type': 'Query', Plans: [{'Node Type': 'ResultSet', PlanNodeId: 1}]},
            SimplifiedPlan,
        },
    });
    expect(getInitialQueryPlanView(data)).toBe(expected);
    expect(data.preparedPlan?.pristine).toEqual(data.plan);
});
