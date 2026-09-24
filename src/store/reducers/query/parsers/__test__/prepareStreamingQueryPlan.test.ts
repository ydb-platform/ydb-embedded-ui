import {prepareStreamingQueryPlan} from '../prepareStreamingQueryPlan';

const plan = (body: string) => `{"meta": {"version": "0.2", "type": "query"}, ${body}}`;

describe('prepareStreamingQueryPlan', () => {
    test('reports an empty plan for missing, empty and metadata-only text', () => {
        expect(prepareStreamingQueryPlan(undefined).state).toBe('empty');
        expect(prepareStreamingQueryPlan('').state).toBe('empty');
        expect(prepareStreamingQueryPlan('{}').state).toBe('empty');
        expect(prepareStreamingQueryPlan('{"meta": {"version": "0.2"}}').state).toBe('empty');
    });

    test('reports an unparsed plan for text that is not readable', () => {
        // The backend truncates an oversized plan, which leaves invalid JSON behind.
        expect(prepareStreamingQueryPlan(`${plan('"Plan": {"Node')}...\n(TRUNCATED)`).state).toBe(
            'unparsed',
        );
        expect(prepareStreamingQueryPlan('{not json').state).toBe('unparsed');
    });

    test('reports an unparsed plan for a root that is not a plan node', () => {
        expect(prepareStreamingQueryPlan(plan('"Plan": {}')).state).toBe('unparsed');
        expect(prepareStreamingQueryPlan(plan('"Plan": {"Node Type": {}}')).state).toBe('unparsed');
        expect(prepareStreamingQueryPlan(plan('"Plan": {"Plans": {}}')).state).toBe('unparsed');
    });

    test('reports an unparsed plan when a node cannot be rendered', () => {
        expect(
            prepareStreamingQueryPlan(plan('"Plan": {"Node Type": "Stage", "PlanNodeId": {}}'))
                .state,
        ).toBe('unparsed');
        expect(
            prepareStreamingQueryPlan(
                plan(
                    '"Plan": {"Node Type": "Query", "Plans": [{"Node Type": "Stage", "Operators": [{"Name": {}}]}]}',
                ),
            ).state,
        ).toBe('unparsed');
    });

    test('reports an unsupported version separately from a missing plan', () => {
        const result = prepareStreamingQueryPlan(
            '{"meta": {"version": "0.1", "type": "query"}, "Plan": {"Node Type": "Stage"}}',
        );
        expect(result.state).toBe('unsupported');
        expect(result.prepared).toBeUndefined();
    });

    test('prepares nodes of a supported plan', () => {
        const result = prepareStreamingQueryPlan(
            plan('"Plan": {"PlanNodeId": 1, "Node Type": "Stage", "Plans": []}'),
        );
        expect(result.state).toBe('ready');
        expect(result.prepared?.nodes?.length).toBeGreaterThan(0);
    });
});
