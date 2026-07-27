import type {YdbEmbeddedAPI} from '../../../services/api';
import {collectDiagnosticsData} from '../utils';

describe('collectDiagnosticsData', () => {
    const originalApi = window.api;

    afterEach(() => {
        window.api = originalApi;
    });

    test('passes database to the backend version request', async () => {
        const getNodeInfo = jest.fn().mockResolvedValue({
            SystemStateInfo: [{Version: 'test-backend-version'}],
        });
        window.api = {
            viewer: {
                getNodeInfo,
            },
        } as unknown as YdbEmbeddedAPI;

        const result = await collectDiagnosticsData(new Error('Test error'), '/Root/test-database');

        expect(getNodeInfo).toHaveBeenCalledWith(
            {
                nodeId: '.',
                database: '/Root/test-database',
            },
            {timeout: 1000},
        );
        expect(result.backendVersion).toBe('test-backend-version');
    });
});
