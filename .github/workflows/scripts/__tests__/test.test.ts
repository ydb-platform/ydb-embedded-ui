import {compareTests, extractTestsFromSuite, isTestSkipped} from '../utils/test';

import type {Spec, Suite, TestInfo} from './types';

describe('test utils', () => {
    describe('isTestSkipped', () => {
        test('should return true for test with skip annotation', () => {
            const spec: Spec = {
                title: 'Test',
                ok: true,
                tags: [],
                id: '1',
                file: 'test.spec.ts',
                line: 1,
                column: 1,
                tests: [
                    {
                        timeout: 5000,
                        annotations: [{type: 'skip'}],
                        expectedStatus: 'passed',
                        projectId: '1',
                        projectName: 'test',
                        results: [],
                        status: 'passed',
                    },
                ],
            };
            expect(isTestSkipped(spec)).toBe(true);
        });

        test('should return true for test with skipped status', () => {
            const spec: Spec = {
                title: 'Test',
                ok: true,
                tags: [],
                id: '1',
                file: 'test.spec.ts',
                line: 1,
                column: 1,
                tests: [
                    {
                        timeout: 5000,
                        annotations: [],
                        expectedStatus: 'skipped',
                        projectId: '1',
                        projectName: 'test',
                        results: [],
                        status: 'skipped',
                    },
                ],
            };
            expect(isTestSkipped(spec)).toBe(true);
        });

        test('should return false for non-skipped test', () => {
            const spec: Spec = {
                title: 'Test',
                ok: true,
                tags: [],
                id: '1',
                file: 'test.spec.ts',
                line: 1,
                column: 1,
                tests: [
                    {
                        timeout: 5000,
                        annotations: [],
                        expectedStatus: 'passed',
                        projectId: '1',
                        projectName: 'test',
                        results: [],
                        status: 'passed',
                    },
                ],
            };
            expect(isTestSkipped(spec)).toBe(false);
        });
    });

    describe('extractTestsFromSuite', () => {
        test('should extract tests from a simple suite', () => {
            const suite: Suite = {
                title: 'Suite 1',
                file: 'test.spec.ts',
                column: 1,
                line: 1,
                specs: [
                    {
                        title: 'Test 1',
                        ok: true,
                        tags: [],
                        id: '1',
                        file: 'test.spec.ts',
                        line: 2,
                        column: 1,
                        tests: [
                            {
                                timeout: 5000,
                                annotations: [],
                                expectedStatus: 'passed',
                                projectId: '1',
                                projectName: 'test',
                                results: [],
                                status: 'passed',
                            },
                        ],
                    },
                ],
                suites: [],
            };

            const result = extractTestsFromSuite(suite);
            expect(result).toEqual([
                {
                    title: 'Test 1',
                    fullTitle: 'Suite 1 > Test 1',
                    status: 'passed',
                    file: 'test.spec.ts',
                    skipped: false,
                },
            ]);
        });

        test('should handle nested suites', () => {
            const suite: Suite = {
                title: 'Parent Suite',
                file: 'test.spec.ts',
                column: 1,
                line: 1,
                specs: [],
                suites: [
                    {
                        title: 'Child Suite',
                        file: 'test.spec.ts',
                        column: 1,
                        line: 2,
                        specs: [
                            {
                                title: 'Test 1',
                                ok: true,
                                tags: [],
                                id: '1',
                                file: 'test.spec.ts',
                                line: 3,
                                column: 1,
                                tests: [
                                    {
                                        timeout: 5000,
                                        annotations: [],
                                        expectedStatus: 'passed',
                                        projectId: '1',
                                        projectName: 'test',
                                        results: [],
                                        status: 'passed',
                                    },
                                ],
                            },
                        ],
                        suites: [],
                    },
                ],
            };

            const result = extractTestsFromSuite(suite);
            expect(result).toEqual([
                {
                    title: 'Test 1',
                    fullTitle: 'Parent Suite > Child Suite > Test 1',
                    status: 'passed',
                    file: 'test.spec.ts',
                    skipped: false,
                },
            ]);
        });
    });

    describe('compareTests', () => {
        test('should identify new, skipped, and deleted tests', () => {
            const currentTests: TestInfo[] = [
                {
                    title: 'Test 1',
                    fullTitle: 'Suite > Test 1',
                    file: 'test.spec.ts',
                    status: 'passed',
                    skipped: false,
                },
                {
                    title: 'Test 2',
                    fullTitle: 'Suite > Test 2',
                    file: 'test.spec.ts',
                    status: 'skipped',
                    skipped: true,
                },
            ];

            const mainTests: TestInfo[] = [
                {
                    title: 'Test 3',
                    fullTitle: 'Suite > Test 3',
                    file: 'test.spec.ts',
                    status: 'passed',
                    skipped: false,
                },
            ];

            const result = compareTests(currentTests, mainTests);
            expect(result).toEqual({
                new: ['Test 1 (test.spec.ts)', 'Test 2 (test.spec.ts)'],
                skipped: ['Test 2 (test.spec.ts)'],
                deleted: ['Test 3 (test.spec.ts)'],
            });
        });

        test('should handle empty test arrays', () => {
            const result = compareTests([], []);
            expect(result).toEqual({
                new: [],
                skipped: [],
                deleted: [],
            });
        });
    });
});
