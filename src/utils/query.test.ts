import type {PlanMeta, PlanNode, PlanTable, TKqpStatsQuery} from '../types/api/query';
import {
    parseQueryAPIExecuteResponse,
    parseQueryAPIExplainResponse,
    parseQueryExplainPlan,
} from './query';

describe('API utils', () => {
    describe('json/viewer/query', () => {
        describe('parseQueryAPIExecuteResponse', () => {
            describe('should handle responses with incorrect format', () => {
                it('should handle null response', () => {
                    expect(parseQueryAPIExecuteResponse(null)).toEqual({});
                });
                it('should handle undefined response', () => {
                    expect(parseQueryAPIExecuteResponse(undefined)).toEqual({});
                });
                it('should handle string response', () => {
                    expect(parseQueryAPIExecuteResponse('foo')).toEqual({});
                });
                it('should handle array response', () => {
                    expect(parseQueryAPIExecuteResponse([{foo: 'bar'}])).toEqual({});
                });
                it('should handle json string in the result field', () => {
                    const json = {foo: 'bar'};
                    const response = {result: JSON.stringify(json)};
                    expect(parseQueryAPIExecuteResponse(response)).toEqual({});
                });
                it('should handle object with request plan in the result field', () => {
                    const response = {result: {queries: 'some queries'}};
                    expect(parseQueryAPIExecuteResponse(response)).toEqual({});
                });
            });
            describe('should correctly parse data', () => {
                it('should parse modern schema result to KeyValueRow', () => {
                    const response = {
                        result: [['42', 'hello world']],
                        columns: [
                            {
                                name: 'id',
                                type: 'Uint64?',
                            },
                            {
                                name: 'value',
                                type: 'Utf8?',
                            },
                        ],
                    };
                    const parsedResponse = parseQueryAPIExecuteResponse(response);
                    expect(parsedResponse.result).toEqual([
                        {
                            id: '42',
                            value: 'hello world',
                        },
                    ]);
                    expect(parsedResponse.columns).toEqual(response.columns);
                });
                it('should return KeyValueRow result for ydb and classic schemas unchanged', () => {
                    const response = {result: [{foo: 'bar'}]};
                    expect(parseQueryAPIExecuteResponse(response).result).toEqual(response.result);
                });
                it('shoudl return stats for modern schema', () => {
                    const response = {
                        result: [['42', 'hello world']],
                        columns: [
                            {
                                name: 'id',
                                type: 'Uint64?',
                            },
                            {
                                name: 'value',
                                type: 'Utf8?',
                            },
                        ],
                        stats: {metric: 'good'},
                    };
                    const parsedResponse = parseQueryAPIExecuteResponse(response);
                    expect(parsedResponse.result).toEqual([
                        {
                            id: '42',
                            value: 'hello world',
                        },
                    ]);
                    expect(parsedResponse.columns).toEqual(response.columns);
                    expect(parsedResponse.stats).toEqual(response.stats);
                });
                it('shoudl return stats for ydb and classic schemas', () => {
                    const response = {
                        result: [{foo: 'bar'}],
                        stats: {metric: 'good'},
                    };
                    const parsedResponse = parseQueryAPIExecuteResponse(response);
                    expect(parsedResponse.result).toEqual(response.result);
                    expect(parsedResponse.stats).toEqual(response.stats);
                });
                it('should accept stats without a result', () => {
                    const stats = {metric: 'good'} as TKqpStatsQuery;
                    const response = {stats};
                    const actual = parseQueryAPIExecuteResponse(response);
                    expect(actual.result).toBeUndefined();
                    expect(actual.columns).toBeUndefined();
                    expect(actual.stats).toEqual(response.stats);
                });
            });
        });

        describe('parseQueryAPIExplainResponse', () => {
            describe('should handle responses with incorrect format', () => {
                it('should handle null response', () => {
                    expect(parseQueryAPIExecuteResponse(null)).toEqual({});
                });
                it('should handle undefined response', () => {
                    expect(parseQueryAPIExecuteResponse(undefined)).toEqual({});
                });
                it('should handle object with plan in the result field', () => {
                    const response = {result: {foo: 'bar'}};
                    expect(parseQueryAPIExecuteResponse(response)).toEqual({});
                });
            });

            describe('should correctly parse data', () => {
                it('should parse explain-scan', () => {
                    const plan: PlanNode = {};
                    const tables: PlanTable[] = [];
                    const meta: PlanMeta = {version: '0.2', type: 'script'};
                    const ast = 'ast';
                    const response = {plan: {Plan: plan, tables, meta}, ast};
                    expect(parseQueryAPIExplainResponse(response)).toBe(response);
                });
                it('should parse explain-script', () => {
                    const plan: PlanNode = {};
                    const tables: PlanTable[] = [];
                    const meta: PlanMeta = {version: '0.2', type: 'script'};

                    const response = {
                        plan: {queries: [{Plan: plan, tables}], meta},
                    };
                    expect(parseQueryAPIExplainResponse(response)).toBe(response);
                });
            });
        });

        describe('parseQueryExplainPlan', () => {
            it('should parse explain script plan to explain scan', () => {
                const plan: PlanNode = {};
                const tables: PlanTable[] = [];
                const meta: PlanMeta = {version: '0.2', type: 'script'};

                const rawPlan = {
                    queries: [
                        {
                            Plan: plan,
                            tables,
                        },
                    ],
                    meta,
                };
                const parsedPlan = parseQueryExplainPlan(rawPlan);
                expect(parsedPlan.Plan).toEqual(plan);
                expect(parsedPlan.tables).toBe(tables);
                expect(parsedPlan.meta).toEqual(meta);
            });
            it('should left scan plan unchanged', () => {
                const plan: PlanNode = {};
                const tables: PlanTable[] = [];
                const meta: PlanMeta = {version: '0.2', type: 'script'};

                const rawPlan = {
                    Plan: plan,
                    tables: tables,
                    meta: meta,
                };
                const parsedPlan = parseQueryExplainPlan(rawPlan);
                expect(parsedPlan).toEqual(rawPlan);
            });
        });
    });
});
