import {getDefaultResultSection, getResultSections, resolveResultSection} from '../constants';

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
