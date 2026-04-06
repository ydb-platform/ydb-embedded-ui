import type {KeyValueRow} from '../../../../../types/api/query';
import {createQueryInfoItems} from '../utils';

describe('createQueryInfoItems', () => {
    it('should return empty array for empty data', () => {
        const result = createQueryInfoItems({});
        expect(result).toEqual([]);
    });

    it('should include QueryText hash when present', () => {
        const result = createQueryInfoItems({QueryText: 'SELECT 1'});
        const hashItem = result.find((item) => item.name === 'Query Hash');
        expect(hashItem).toBeDefined();
        expect(hashItem?.content).toBeTruthy();
    });

    it('should include UserSID when present and non-empty', () => {
        const result = createQueryInfoItems({UserSID: 'test-user'});
        const userItem = result.find((item) => item.name === 'User');
        expect(userItem).toBeDefined();
        expect(userItem?.content).toBe('test-user');
    });

    it('should skip UserSID when empty string', () => {
        const result = createQueryInfoItems({UserSID: ''});
        const userItem = result.find((item) => item.name === 'User');
        expect(userItem).toBeUndefined();
    });

    it('should include ApplicationName when present and non-empty', () => {
        const result = createQueryInfoItems({ApplicationName: 'my-app'});
        const appItem = result.find((item) => item.name === 'Application');
        expect(appItem).toBeDefined();
        expect(appItem?.content).toBe('my-app');
    });

    it('should skip ApplicationName when empty string', () => {
        const result = createQueryInfoItems({ApplicationName: ''});
        const appItem = result.find((item) => item.name === 'Application');
        expect(appItem).toBeUndefined();
    });

    it('should skip fields that are null', () => {
        const data: KeyValueRow = {
            QueryText: null,
            UserSID: null,
            WmPoolId: null,
            ClientPID: null,
        };
        const result = createQueryInfoItems(data);
        expect(result).toEqual([]);
    });

    it('should skip fields that are undefined', () => {
        const data: KeyValueRow = {
            QueryText: undefined,
            UserSID: undefined,
            WmPoolId: undefined,
        };
        const result = createQueryInfoItems(data);
        expect(result).toEqual([]);
    });

    it('should include WmPoolId with falsy value 0', () => {
        const result = createQueryInfoItems({WmPoolId: 0});
        const wmItem = result.find((item) => item.name === 'WM Pool ID');
        expect(wmItem).toBeDefined();
        expect(wmItem?.content).toBe(0);
    });

    it('should skip WmPoolId when empty string', () => {
        const result = createQueryInfoItems({WmPoolId: ''});
        const wmItem = result.find((item) => item.name === 'WM Pool ID');
        expect(wmItem).toBeUndefined();
    });

    it('should include WmState when present', () => {
        const result = createQueryInfoItems({WmState: 'Running'});
        const wmItem = result.find((item) => item.name === 'WM State');
        expect(wmItem).toBeDefined();
        expect(wmItem?.content).toBe('Running');
    });

    it('should skip WmState when empty string', () => {
        const result = createQueryInfoItems({WmState: ''});
        const wmItem = result.find((item) => item.name === 'WM State');
        expect(wmItem).toBeUndefined();
    });

    it('should include WmEnterTime when present', () => {
        const result = createQueryInfoItems({WmEnterTime: '2024-01-01T00:00:00Z'});
        const wmItem = result.find((item) => item.name === 'WM Enter Time');
        expect(wmItem).toBeDefined();
        expect(wmItem?.content).toBeTruthy();
    });

    it('should skip WmEnterTime when empty string', () => {
        const result = createQueryInfoItems({WmEnterTime: ''});
        const wmItem = result.find((item) => item.name === 'WM Enter Time');
        expect(wmItem).toBeUndefined();
    });

    it('should include WmExitTime when present', () => {
        const result = createQueryInfoItems({WmExitTime: '2024-01-01T00:00:00Z'});
        const wmItem = result.find((item) => item.name === 'WM Exit Time');
        expect(wmItem).toBeDefined();
        expect(wmItem?.content).toBeTruthy();
    });

    it('should skip WmExitTime when empty string', () => {
        const result = createQueryInfoItems({WmExitTime: ''});
        const wmItem = result.find((item) => item.name === 'WM Exit Time');
        expect(wmItem).toBeUndefined();
    });

    it('should include ClientAddress when present', () => {
        const result = createQueryInfoItems({ClientAddress: '192.168.1.1'});
        const item = result.find((item) => item.name === 'Client Address');
        expect(item).toBeDefined();
        expect(item?.content).toBe('192.168.1.1');
    });

    it('should skip ClientAddress when empty string', () => {
        const result = createQueryInfoItems({ClientAddress: ''});
        const item = result.find((item) => item.name === 'Client Address');
        expect(item).toBeUndefined();
    });

    it('should include ClientPID with falsy value 0', () => {
        const result = createQueryInfoItems({ClientPID: 0});
        const item = result.find((item) => item.name === 'Client PID');
        expect(item).toBeDefined();
        expect(item?.content).toBe(0);
    });

    it('should include ClientUserAgent when present', () => {
        const result = createQueryInfoItems({ClientUserAgent: 'ydb-go-sdk/3.0'});
        const item = result.find((item) => item.name === 'Client User Agent');
        expect(item).toBeDefined();
        expect(item?.content).toBe('ydb-go-sdk/3.0');
    });

    it('should skip ClientUserAgent when empty string', () => {
        const result = createQueryInfoItems({ClientUserAgent: ''});
        const item = result.find((item) => item.name === 'Client User Agent');
        expect(item).toBeUndefined();
    });

    it('should include ClientSdkBuildInfo when present', () => {
        const result = createQueryInfoItems({ClientSdkBuildInfo: 'v1.2.3'});
        const item = result.find((item) => item.name === 'Client SDK Build Info');
        expect(item).toBeDefined();
        expect(item?.content).toBe('v1.2.3');
    });

    it('should skip ClientSdkBuildInfo when empty string', () => {
        const result = createQueryInfoItems({ClientSdkBuildInfo: ''});
        const item = result.find((item) => item.name === 'Client SDK Build Info');
        expect(item).toBeUndefined();
    });

    it('should include all fields when all are present', () => {
        const data: KeyValueRow = {
            QueryText: 'SELECT 1',
            CPUTimeUs: '1000',
            Duration: '5000',
            ReadBytes: '2048',
            RequestUnits: '10',
            EndTime: '2024-01-01T00:00:00Z',
            ReadRows: '100',
            UserSID: 'user1',
            ApplicationName: 'app1',
            QueryStartAt: '2024-01-01T00:00:00Z',
            WmPoolId: 'pool-1',
            WmState: 'Running',
            WmEnterTime: '2024-01-01T00:00:00Z',
            WmExitTime: '2024-01-01T01:00:00Z',
            ClientAddress: '10.0.0.1',
            ClientPID: '12345',
            ClientUserAgent: 'sdk/1.0',
            ClientSdkBuildInfo: 'v2.0',
        };

        const result = createQueryInfoItems(data);

        expect(result.length).toBe(18);

        const names = result.map((item) => item.name);
        expect(names).toContain('Query Hash');
        expect(names).toContain('CPU Time');
        expect(names).toContain('Duration');
        expect(names).toContain('Read Bytes');
        expect(names).toContain('Request Units');
        expect(names).toContain('End time');
        expect(names).toContain('Read Rows');
        expect(names).toContain('User');
        expect(names).toContain('Application');
        expect(names).toContain('Start time');
        expect(names).toContain('WM Pool ID');
        expect(names).toContain('WM State');
        expect(names).toContain('WM Enter Time');
        expect(names).toContain('WM Exit Time');
        expect(names).toContain('Client Address');
        expect(names).toContain('Client PID');
        expect(names).toContain('Client User Agent');
        expect(names).toContain('Client SDK Build Info');
    });
});
