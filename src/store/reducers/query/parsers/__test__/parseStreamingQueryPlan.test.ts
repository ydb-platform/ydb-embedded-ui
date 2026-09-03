import {parseStreamingQueryPlan} from '../parseStreamingQueryPlan';

describe('parseStreamingQueryPlan', () => {
    test('returns undefined for undefined input', () => {
        expect(parseStreamingQueryPlan(undefined)).toBeUndefined();
    });

    test('returns undefined for empty string', () => {
        expect(parseStreamingQueryPlan('')).toBeUndefined();
    });

    test('returns undefined for empty object JSON', () => {
        expect(parseStreamingQueryPlan('{}')).toBeUndefined();
    });

    test('returns undefined for malformed JSON', () => {
        expect(parseStreamingQueryPlan('{not valid json')).toBeUndefined();
    });

    test('returns undefined when meta is missing even if Plan is present', () => {
        expect(parseStreamingQueryPlan(JSON.stringify({Plan: {PlanNodeId: 1}}))).toBeUndefined();
    });

    test('returns parsed object for valid plan with meta', () => {
        const plan = {
            meta: {version: '0.2', type: 'query'},
            Plan: {PlanNodeId: 1, PlanNodeType: 'Query', Plans: []},
        };
        const result = parseStreamingQueryPlan(JSON.stringify(plan));
        expect(result).toEqual(plan);
    });

    test('returns parsed object for plan with unsupported meta version', () => {
        const plan = {
            meta: {version: '0.1', type: 'query'},
            Plan: {PlanNodeId: 1, PlanNodeType: 'Query', Plans: []},
        };
        const result = parseStreamingQueryPlan(JSON.stringify(plan));
        expect(result).toEqual(plan);
    });
});
