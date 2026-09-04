import {prepareStreamingQueryPlan} from '../prepareStreamingQueryPlan';

const plan = (body: string) => `{"meta": {"version": "0.2", "type": "query"}, ${body}}`;

describe('prepareStreamingQueryPlan', () => {
    test('reports no plan for missing, empty and malformed text', () => {
        expect(prepareStreamingQueryPlan(undefined).hasPlan).toBe(false);
        expect(prepareStreamingQueryPlan('').hasPlan).toBe(false);
        expect(prepareStreamingQueryPlan('{}').hasPlan).toBe(false);
        expect(prepareStreamingQueryPlan('{not json').hasPlan).toBe(false);
    });

    test('prepares nodes of a supported plan', () => {
        const result = prepareStreamingQueryPlan(
            plan('"Plan": {"PlanNodeId": 1, "Node Type": "Stage", "Plans": []}'),
        );
        expect(result.hasPlan).toBe(true);
        expect(result.prepared?.nodes?.length).toBeGreaterThan(0);
    });

    test('keeps a structurally invalid plan from throwing', () => {
        const result = prepareStreamingQueryPlan(plan('"Plan": {"Plans": {}}'));
        expect(result.hasPlan).toBe(true);
        expect(result.prepared).toBeUndefined();
    });

    test('reports an unsupported version without nodes', () => {
        const result = prepareStreamingQueryPlan(
            '{"meta": {"version": "0.1", "type": "query"}, "Plan": {"Node Type": "Stage"}}',
        );
        expect(result.hasPlan).toBe(true);
        expect(result.prepared?.nodes).toBeUndefined();
    });
});
