import fs from 'fs';

import {getTestStatus, readTestResults} from '../utils/results';

import type {TestResults, TestResultsInfo, TestStatusInfo} from './types';

jest.mock('fs');

describe('results utils', () => {
    describe('readTestResults', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should handle non-existent file', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            const result = readTestResults('nonexistent.json');
            expect(result).toEqual({
                total: 0,
                passed: 0,
                failed: 0,
                flaky: 0,
                skipped: 0,
                tests: [],
            });
        });

        test('should read and process test results correctly', () => {
            const mockTestResults: TestResults = {
                config: {} as any,
                suites: [
                    {
                        title: 'Test Suite',
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
                    },
                ],
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(
                JSON.stringify({
                    ...mockTestResults,
                    stats: {
                        expected: 5,
                        unexpected: 2,
                        flaky: 1,
                        skipped: 3,
                    },
                }),
            );

            const result = readTestResults('test-results.json');
            expect(result).toEqual({
                total: 11,
                passed: 5,
                failed: 2,
                flaky: 1,
                skipped: 3,
                tests: expect.any(Array),
            });
        });
    });

    describe('getTestStatus', () => {
        test('should return failed status when there are failures', () => {
            const results: TestResultsInfo = {
                total: 10,
                passed: 8,
                failed: 2,
                flaky: 0,
                skipped: 0,
                tests: [],
            };

            const result = getTestStatus(results) as TestStatusInfo;
            expect(result.status).toBe('❌ FAILED');
            expect(result.statusColor).toBe('red');
        });

        test('should return flaky status when there are flaky tests but no failures', () => {
            const results: TestResultsInfo = {
                total: 10,
                passed: 8,
                failed: 0,
                flaky: 2,
                skipped: 0,
                tests: [],
            };

            const result = getTestStatus(results) as TestStatusInfo;
            expect(result.status).toBe('⚠️ FLAKY');
            expect(result.statusColor).toBe('orange');
        });

        test('should return passed status when all tests pass', () => {
            const results: TestResultsInfo = {
                total: 10,
                passed: 10,
                failed: 0,
                flaky: 0,
                skipped: 0,
                tests: [],
            };

            const result = getTestStatus(results) as TestStatusInfo;
            expect(result.status).toBe('✅ PASSED');
            expect(result.statusColor).toBe('green');
        });
    });
});
