import {parseCoresUrl, parseLoggingUrls, parseTraceField} from '../parseFields';

describe('parseCoresUrl', () => {
    test('It should parse stringified json with cores url', () => {
        expect(parseCoresUrl('{"url":"https://coredumps.com?cluster=my_cluster"}')).toEqual({
            url: 'https://coredumps.com?cluster=my_cluster',
        });
    });

    test('It should return undefined if input is undefined', () => {
        expect(parseCoresUrl(undefined)).toEqual(undefined);
    });
    test('It should return undefined if input is incorrect', () => {
        expect(parseCoresUrl('hello')).toEqual(undefined);
    });

    test('It should return the object as-is if input is already an object', () => {
        const coresObject = {url: 'https://coredumps.com?cluster=my_cluster'};
        expect(parseCoresUrl(coresObject)).toEqual(coresObject);
    });
});

describe('parseLoggingUrls', () => {
    test('It should parse stringified json with logging and slo logs urls', () => {
        expect(
            parseLoggingUrls(
                '{"url":"https://logging.com/logs?cluster=my_cluster","slo_logs_url":"https://logging.com/slo-logs?cluster=my_cluster"}',
            ),
        ).toEqual({
            url: 'https://logging.com/logs?cluster=my_cluster',
            slo_logs_url: 'https://logging.com/slo-logs?cluster=my_cluster',
        });
    });
    test('It should parse stringified json with only logging url', () => {
        expect(parseLoggingUrls('{"url":"https://logging.com/logs?cluster=my_cluster"}')).toEqual({
            url: 'https://logging.com/logs?cluster=my_cluster',
        });
    });
    test('It should parse stringified json with only slo logs url', () => {
        expect(
            parseLoggingUrls('{"slo_logs_url":"https://logging.com/slo-logs?cluster=my_cluster"}'),
        ).toEqual({
            slo_logs_url: 'https://logging.com/slo-logs?cluster=my_cluster',
        });
    });
    test('It should return undefined if input is undefined', () => {
        expect(parseLoggingUrls(undefined)).toEqual(undefined);
    });
    test('It should return undefined if input is incorrect', () => {
        expect(parseLoggingUrls('hello')).toEqual(undefined);
    });

    test('It should return the object as-is if input is already an object', () => {
        const loggingObject = {
            url: 'https://logging.com/logs?cluster=my_cluster',
            slo_logs_url: 'https://logging.com/slo-logs?cluster=my_cluster',
        };
        expect(parseLoggingUrls(loggingObject)).toEqual(loggingObject);
    });

    test('It should return the object as-is if input is already an object with only url', () => {
        const loggingObject = {url: 'https://logging.com/logs?cluster=my_cluster'};
        expect(parseLoggingUrls(loggingObject)).toEqual(loggingObject);
    });

    test('It should return the object as-is if input is already an object with only slo_logs_url', () => {
        const loggingObject = {slo_logs_url: 'https://logging.com/slo-logs?cluster=my_cluster'};
        expect(parseLoggingUrls(loggingObject)).toEqual(loggingObject);
    });
});

describe('parseTraceField', () => {
    test('It should parse stringified json with trace view url', () => {
        expect(parseTraceField('{"url":"https://tracing.com/trace?cluster=my_cluster"}')).toEqual({
            url: 'https://tracing.com/trace?cluster=my_cluster',
        });
    });

    test('It should return undefined if input is undefined', () => {
        expect(parseTraceField(undefined)).toEqual(undefined);
    });

    test('It should return undefined if input is empty string', () => {
        expect(parseTraceField('')).toEqual(undefined);
    });

    test('It should return undefined if input is incorrect json', () => {
        expect(parseTraceField('hello')).toEqual(undefined);
    });

    test('It should return undefined if parsed json does not match schema', () => {
        expect(parseTraceField('{"invalid":"field"}')).toEqual(undefined);
    });

    test('It should return the object as-is if input is already an object', () => {
        const traceObject = {url: 'https://tracing.com/trace?cluster=my_cluster'};
        expect(parseTraceField(traceObject)).toEqual(traceObject);
    });
});
