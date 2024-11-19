import type {
    PlanMeta,
    PlanNode,
    PlanTable,
    SimplifiedNode,
    TKqpStatsQuery,
} from '../types/api/query';

import {parseQueryAPIResponse, parseQueryExplainPlan} from './query';

describe('API utils', () => {
    describe('json/viewer/query', () => {
        describe('parseQueryAPIResponse', () => {
            describe('should handle responses with incorrect format', () => {
                it('should handle null response', () => {
                    expect(parseQueryAPIResponse(null)).toEqual({});
                });
                it('should handle undefined response', () => {
                    expect(parseQueryAPIResponse(undefined)).toEqual({});
                });
                it('should handle string response', () => {
                    expect(parseQueryAPIResponse('foo')).toEqual({});
                });
                it('should handle array response', () => {
                    expect(parseQueryAPIResponse([{foo: 'bar'}])).toEqual({});
                });
                it('should handle json string in the result field', () => {
                    const json = {foo: 'bar'};
                    const response = {result: JSON.stringify(json)};
                    expect(parseQueryAPIResponse(response)).toEqual({});
                });
                it('should handle object with request plan in the result field', () => {
                    const response = {result: {queries: 'some queries'}};
                    expect(parseQueryAPIResponse(response)).toEqual({});
                });
            });
            describe('should correctly parse data', () => {
                it('should accept stats without a result', () => {
                    const stats = {metric: 'good'} as TKqpStatsQuery;
                    const response = {stats};
                    const actual = parseQueryAPIResponse(response);
                    expect(actual.resultSets?.[0]?.result).toBeUndefined();
                    expect(actual.columns).toBeUndefined();
                    expect(actual.stats).toEqual(response.stats);
                });

                const mockColumns = [
                    {name: 'PDiskFilter', type: 'Utf8?'},
                    {name: 'ErasureSpecies', type: 'Utf8?'},
                    {name: 'CurrentAvailableSize', type: 'Uint64?'},
                    {name: 'CurrentAllocatedSize', type: 'Uint64?'},
                    {name: 'CurrentGroupsCreated', type: 'Uint32?'},
                    {name: 'AvailableGroupsToCreate', type: 'Uint32?'},
                ];

                const mockRows = [
                    ['Type:SSD', 'block-4-2', '1000', '2000', 100, 50],
                    ['Type:ROT', 'block-4-2', '2000', '1000', 50, 0],
                ];

                it('should parse a valid ExecuteResponse correctly', () => {
                    const input = {
                        result: [
                            {
                                columns: mockColumns,
                                rows: mockRows,
                                truncated: false,
                            },
                        ],
                        stats: {DurationUs: '1000'},
                    };

                    const expected = {
                        resultSets: [
                            {
                                columns: mockColumns,
                                result: [
                                    {
                                        PDiskFilter: 'Type:SSD',
                                        ErasureSpecies: 'block-4-2',
                                        CurrentAvailableSize: '1000',
                                        CurrentAllocatedSize: '2000',
                                        CurrentGroupsCreated: 100,
                                        AvailableGroupsToCreate: 50,
                                    },
                                    {
                                        PDiskFilter: 'Type:ROT',
                                        ErasureSpecies: 'block-4-2',
                                        CurrentAvailableSize: '2000',
                                        CurrentAllocatedSize: '1000',
                                        CurrentGroupsCreated: 50,
                                        AvailableGroupsToCreate: 0,
                                    },
                                ],
                                truncated: false,
                            },
                        ],
                        stats: {DurationUs: '1000'},
                    };

                    expect(parseQueryAPIResponse(input)).toEqual(expected);
                });

                it('should handle empty result array', () => {
                    const input = {
                        result: [],
                        stats: {DurationUs: '1000'},
                    };

                    const expected = {
                        result: [],
                        stats: {DurationUs: '1000'},
                    };

                    expect(parseQueryAPIResponse(input)).toEqual(expected);
                });

                it('should handle result with columns but no rows', () => {
                    const input = {
                        result: [
                            {
                                columns: mockColumns,
                                rows: [],
                                truncated: false,
                            },
                        ],
                        stats: {DurationUs: '1000'},
                    };

                    const expected = {
                        resultSets: [
                            {
                                columns: mockColumns,
                                result: [],
                                truncated: false,
                            },
                        ],
                        stats: {DurationUs: '1000'},
                    };

                    expect(parseQueryAPIResponse(input)).toEqual(expected);
                });

                it('should return empty object for unsupported format', () => {
                    const input = {
                        result: 'unsupported',
                    };

                    expect(parseQueryAPIResponse(input)).toEqual({});
                });

                it('should handle multiple result sets', () => {
                    const input = {
                        result: [
                            {
                                columns: mockColumns,
                                rows: mockRows,
                                truncated: false,
                            },
                            {
                                columns: [{name: 'Count', type: 'Uint32?'}],
                                rows: [[2]],
                                truncated: false,
                            },
                        ],
                        stats: {DurationUs: '1500'},
                    };

                    const expected = {
                        resultSets: [
                            {
                                columns: mockColumns,
                                result: [
                                    {
                                        PDiskFilter: 'Type:SSD',
                                        ErasureSpecies: 'block-4-2',
                                        CurrentAvailableSize: '1000',
                                        CurrentAllocatedSize: '2000',
                                        CurrentGroupsCreated: 100,
                                        AvailableGroupsToCreate: 50,
                                    },
                                    {
                                        PDiskFilter: 'Type:ROT',
                                        ErasureSpecies: 'block-4-2',
                                        CurrentAvailableSize: '2000',
                                        CurrentAllocatedSize: '1000',
                                        CurrentGroupsCreated: 50,
                                        AvailableGroupsToCreate: 0,
                                    },
                                ],
                                truncated: false,
                            },
                            {
                                columns: [{name: 'Count', type: 'Uint32?'}],
                                result: [{Count: 2}],
                                truncated: false,
                            },
                        ],
                        stats: {DurationUs: '1500'},
                    };

                    expect(parseQueryAPIResponse(input)).toEqual(expected);
                });

                it('should handle null values in rows', () => {
                    const input = {
                        result: [
                            {
                                columns: mockColumns,
                                rows: [
                                    ['Type:SSD', null, '1000', null, 100, 50],
                                    [null, 'block-4-2', null, '1000', null, 0],
                                ],
                                truncated: false,
                            },
                        ],
                        stats: {DurationUs: '1000'},
                    };

                    const expected = {
                        resultSets: [
                            {
                                columns: mockColumns,
                                result: [
                                    {
                                        PDiskFilter: 'Type:SSD',
                                        ErasureSpecies: null,
                                        CurrentAvailableSize: '1000',
                                        CurrentAllocatedSize: null,
                                        CurrentGroupsCreated: 100,
                                        AvailableGroupsToCreate: 50,
                                    },
                                    {
                                        PDiskFilter: null,
                                        ErasureSpecies: 'block-4-2',
                                        CurrentAvailableSize: null,
                                        CurrentAllocatedSize: '1000',
                                        CurrentGroupsCreated: null,
                                        AvailableGroupsToCreate: 0,
                                    },
                                ],
                                truncated: false,
                            },
                        ],
                        stats: {DurationUs: '1000'},
                    };

                    expect(parseQueryAPIResponse(input)).toEqual(expected);
                });

                it('should handle truncated results', () => {
                    const input = {
                        result: [
                            {
                                columns: mockColumns,
                                rows: mockRows,
                                truncated: true,
                            },
                        ],
                        stats: {DurationUs: '1000'},
                    };

                    const result = parseQueryAPIResponse(input);
                    expect(result.resultSets?.[0].truncated).toBe(true);
                });

                it('should handle empty columns and rows', () => {
                    const input = {
                        result: [
                            {
                                columns: [],
                                rows: [],
                                truncated: false,
                            },
                        ],
                        stats: {DurationUs: '1000'},
                    };

                    const expected = {
                        resultSets: [
                            {
                                columns: [],
                                result: [],
                                truncated: false,
                            },
                        ],
                        stats: {DurationUs: '1000'},
                    };

                    expect(parseQueryAPIResponse(input)).toEqual(expected);
                });
            });
            describe('should correctly parse plans', () => {
                it('should parse explain-scan', () => {
                    const plan: PlanNode = {};
                    const tables: PlanTable[] = [];
                    const meta: PlanMeta = {version: '0.2', type: 'script'};
                    const ast = 'ast';
                    const response = {plan: {Plan: plan, tables, meta}, ast};
                    expect(parseQueryAPIResponse(response)).toBe(response);
                });
                it('should parse explain-script', () => {
                    const plan: PlanNode = {};
                    const tables: PlanTable[] = [];
                    const meta: PlanMeta = {version: '0.2', type: 'script'};

                    const response = {
                        plan: {queries: [{Plan: plan, tables}], meta},
                    };
                    expect(parseQueryAPIResponse(response)).toBe(response);
                });
            });
        });

        describe('parseQueryExplainPlan', () => {
            it('should parse explain script plan to explain scan', () => {
                const plan: PlanNode = {};
                const simplifiedPlan: SimplifiedNode = {};
                const tables: PlanTable[] = [];
                const meta: PlanMeta = {version: '0.2', type: 'script'};

                const rawPlan = {
                    queries: [
                        {
                            Plan: plan,
                            tables,
                            SimplifiedPlan: simplifiedPlan,
                        },
                    ],
                    meta,
                };
                const parsedPlan = parseQueryExplainPlan(rawPlan);
                expect(parsedPlan.Plan).toEqual(plan);
                expect(parsedPlan.SimplifiedPlan).toEqual(simplifiedPlan);
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
