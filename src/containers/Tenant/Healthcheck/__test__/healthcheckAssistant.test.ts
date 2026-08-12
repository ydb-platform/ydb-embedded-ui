import {SelfCheckResult} from '../../../../types/api/healthcheck';
import type {HealthcheckAssistantSnapshot, HealthcheckAssistantTarget} from '../types';
import {getDatabaseHealthcheckAssistantTarget, getHealthcheckAssistantContext} from '../utils';

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
