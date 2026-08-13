import {SelfCheckResult} from '../../../../types/api/healthcheck';
import type {HealthcheckAssistantSnapshot, HealthcheckAssistantTarget} from '../types';
import {
    getDatabaseHealthcheckAssistantTarget,
    getHealthcheckAssistantContext,
    getHealthcheckIssueDisclosureLabel,
} from '../utils';

const target: HealthcheckAssistantTarget = {
    scope: 'database',
    request: {database: '/Root/database'},
};
const snapshot: HealthcheckAssistantSnapshot = {
    selfCheckResult: SelfCheckResult.DEGRADED,
    issues: [],
};

describe('Healthcheck assistant context', () => {
    test('preserves the exact cluster-qualified drawer request', () => {
        expect(
            getDatabaseHealthcheckAssistantTarget({
                database: '/Root',
                clusterName: 'cluster-a',
                scope: 'cluster',
            }),
        ).toEqual({
            scope: 'cluster',
            request: {database: '/Root', clusterName: 'cluster-a'},
        });
    });

    test('treats an empty cluster name as an unqualified request', () => {
        expect(
            getDatabaseHealthcheckAssistantTarget({
                database: '/Root',
                clusterName: '',
                scope: 'database',
            }),
        ).toEqual({
            scope: 'database',
            request: {database: '/Root'},
        });
    });

    test.each([
        [false, 'Expand issue details: Storage is unavailable'],
        [true, 'Collapse issue details: Storage is unavailable'],
    ])('includes the issue in the disclosure label when expanded is %s', (expanded, label) => {
        expect(
            getHealthcheckIssueDisclosureLabel({
                expanded,
                issue: 'Storage is unavailable',
            }),
        ).toBe(label);
    });

    test('keeps a generic disclosure label when the issue message is missing', () => {
        expect(getHealthcheckIssueDisclosureLabel({expanded: false, issue: undefined})).toBe(
            'Expand issue details',
        );
    });

    test('does not expose an assistant context before a successful response', () => {
        expect(
            getHealthcheckAssistantContext({
                hasAction: true,
                successful: false,
                target,
                snapshot,
            }),
        ).toBeUndefined();
    });

    test('exposes the target and snapshot after a successful response', () => {
        expect(
            getHealthcheckAssistantContext({
                hasAction: true,
                successful: true,
                target,
                snapshot,
            }),
        ).toEqual({target, snapshot});
    });
});
