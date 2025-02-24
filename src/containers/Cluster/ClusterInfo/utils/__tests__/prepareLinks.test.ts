import {prepareClusterCoresLink, prepareClusterLoggingLinks} from '../useClusterLinks';

describe('prepareClusterCoresLink', () => {
    test('It should parse stringified json with cores url', () => {
        expect(
            prepareClusterCoresLink('{"url":"https://coredumps.com?cluster=my_cluster"}'),
        ).toEqual('https://coredumps.com?cluster=my_cluster');
    });

    test('It should return undefined if input is undefined', () => {
        expect(prepareClusterCoresLink(undefined)).toEqual(undefined);
    });
    test('It should return undefined if input is incorrect', () => {
        expect(prepareClusterCoresLink('hello')).toEqual(undefined);
    });
});

describe('prepareClusterLoggingLinks', () => {
    test('It should parse stringified json with logging and slo logs urls', () => {
        expect(
            prepareClusterLoggingLinks(
                '{"url":"https://logging.com/logs?cluster=my_cluster","slo_logs_url":"https://logging.com/slo-logs?cluster=my_cluster"}',
            ),
        ).toEqual({
            logsUrl: 'https://logging.com/logs?cluster=my_cluster',
            sloLogsUrl: 'https://logging.com/slo-logs?cluster=my_cluster',
        });
    });
    test('It should parse stringified json with only logging url', () => {
        expect(
            prepareClusterLoggingLinks('{"url":"https://logging.com/logs?cluster=my_cluster"}'),
        ).toEqual({
            logsUrl: 'https://logging.com/logs?cluster=my_cluster',
        });
    });
    test('It should parse stringified json with only slo logs url', () => {
        expect(
            prepareClusterLoggingLinks(
                '{"slo_logs_url":"https://logging.com/slo-logs?cluster=my_cluster"}',
            ),
        ).toEqual({
            sloLogsUrl: 'https://logging.com/slo-logs?cluster=my_cluster',
        });
    });
    test('It should return empty object if input is undefined', () => {
        expect(prepareClusterLoggingLinks(undefined)).toEqual({});
    });
    test('It should return empty object if input is incorrect', () => {
        expect(prepareClusterLoggingLinks('hello')).toEqual({});
    });
});
