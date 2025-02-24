import {
    parseProtobufDurationToMs,
    parseProtobufTimeObjectToMs,
    parseProtobufTimestampToMs,
} from '../';

describe('Protobuf time parsers', () => {
    // 1 - nanoseconds only
    const timeObjectWithNanoseconds = {
        nanos: 123000000,
    };
    const timeWithNanosecondsInMs = 123;

    // 2 - seconds only
    const timeObjectWithSeconds = {
        seconds: '12',
    };
    const timeWithSecondsInMs = 12000;
    const stringDurationSeconds = '12s';

    // 3 - days
    const timeObjectWithDays = {
        seconds: '439234',
        nanos: 123000000,
    };
    const timeWithDaysInMs = 439234123;

    // 4 - TimeStamp
    const timestamp = '2023-01-16T14:26:34.466Z';
    const timestampInMs = 1673879194466;
    const timestampObject = {
        seconds: '1673879194',
        nanos: 466000000,
    };

    describe('parseProtobufTimeObjectToMs', () => {
        test('should work with timestamp object values', () => {
            expect(parseProtobufTimeObjectToMs(timeObjectWithDays)).toEqual(timeWithDaysInMs);
        });
        test('should work with timestamp object without seconds', () => {
            expect(parseProtobufTimeObjectToMs(timeObjectWithNanoseconds)).toEqual(
                timeWithNanosecondsInMs,
            );
        });
        test('should work with timestamp object without nanos', () => {
            expect(parseProtobufTimeObjectToMs(timeObjectWithSeconds)).toEqual(timeWithSecondsInMs);
        });
        test('should work with empty object values', () => {
            expect(parseProtobufTimeObjectToMs({})).toEqual(0);
        });
    });
    describe('parseProtobufTimestampToMs', () => {
        test('should work with string date values', () => {
            expect(parseProtobufTimestampToMs(timestamp)).toEqual(timestampInMs);
        });
        test('should work with timestamp object values', () => {
            expect(parseProtobufTimestampToMs(timestampObject)).toEqual(timestampInMs);
        });
        test('should work with empty object values', () => {
            expect(parseProtobufTimestampToMs({})).toEqual(0);
        });
    });
    describe('parseProtobufDurationToMs', () => {
        test('should work with string values', () => {
            expect(parseProtobufDurationToMs(stringDurationSeconds)).toEqual(timeWithSecondsInMs);
        });
        test('should work with duration object values', () => {
            expect(parseProtobufDurationToMs(timeObjectWithDays)).toEqual(timeWithDaysInMs);
        });
        test('should work with empty object values', () => {
            expect(parseProtobufDurationToMs({})).toEqual(0);
        });
    });
});
