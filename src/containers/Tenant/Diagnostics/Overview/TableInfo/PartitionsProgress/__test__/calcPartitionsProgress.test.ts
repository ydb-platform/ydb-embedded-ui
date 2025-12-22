import {FULL_FILL_VALUE, calcPartitionsProgress} from '../utils';

describe('calcPartitionsProgress', () => {
    describe('when maxPartitions is not provided', () => {
        test('should reserve fixed 20% (1:4) for below-min segment when count < min', () => {
            // minPartitions = 5, partitionsCount = 2
            const res = calcPartitionsProgress(5, undefined, 2);

            expect(res).toEqual({
                min: 5,
                max: undefined,

                partitionsBelowMin: 3,
                partitionsAboveMax: 0,

                isBelowMin: true,
                isAboveMax: false,

                leftSegmentUnits: 1,
                mainSegmentUnits: 4,
                rightSegmentUnits: 0,

                mainProgressValue: 0,
            });
        });

        test('should not show warning segment when count >= min', () => {
            // minPartitions = 3, partitionsCount = 3
            const res = calcPartitionsProgress(3, undefined, 3);

            expect(res).toEqual({
                min: 3,
                max: undefined,

                partitionsBelowMin: 0,
                partitionsAboveMax: 0,

                isBelowMin: false,
                isAboveMax: false,

                leftSegmentUnits: 0,
                mainSegmentUnits: 1,
                rightSegmentUnits: 0,

                mainProgressValue: FULL_FILL_VALUE,
            });
        });
    });

    describe('when maxPartitions is provided', () => {
        test('should calculate proportional progress inside [min, max]', () => {
            // minPartitions = 2, maxPartitions = 6, partitionsCount = 4 => (4-2)/(6-2)=0.5 => 50%
            const res = calcPartitionsProgress(2, 6, 4);

            expect(res).toEqual({
                min: 2,
                max: 6,

                partitionsBelowMin: 0,
                partitionsAboveMax: 0,

                isBelowMin: false,
                isAboveMax: false,

                leftSegmentUnits: 0,
                mainSegmentUnits: 4,
                rightSegmentUnits: 0,

                mainProgressValue: 50,
            });
        });

        test('should show left overflow and empty main when count < min', () => {
            // minPartitions = 5, maxPartitions = 10, partitionsCount = 2
            const res = calcPartitionsProgress(5, 10, 2);

            expect(res).toEqual({
                min: 5,
                max: 10,

                partitionsBelowMin: 3,
                partitionsAboveMax: 0,

                isBelowMin: true,
                isAboveMax: false,

                leftSegmentUnits: 3,
                mainSegmentUnits: 5,
                rightSegmentUnits: 0,

                mainProgressValue: 0,
            });
        });

        test('should show right overflow and full main when count > max', () => {
            // minPartitions = 3, maxPartitions = 10, partitionsCount = 13
            const res = calcPartitionsProgress(3, 10, 13);

            expect(res).toEqual({
                min: 3,
                max: 10,

                partitionsBelowMin: 0,
                partitionsAboveMax: 3,

                isBelowMin: false,
                isAboveMax: true,

                leftSegmentUnits: 0,
                mainSegmentUnits: 7,
                rightSegmentUnits: 3,

                mainProgressValue: FULL_FILL_VALUE,
            });
        });

        test('should fill main segment when min === max and count equals limits', () => {
            // minPartitions = 5, maxPartitions = 5, partitionsCount = 5
            const res = calcPartitionsProgress(5, 5, 5);

            expect(res).toEqual({
                min: 5,
                max: 5,

                partitionsBelowMin: 0,
                partitionsAboveMax: 0,

                isBelowMin: false,
                isAboveMax: false,

                leftSegmentUnits: 0,
                mainSegmentUnits: 1,
                rightSegmentUnits: 0,

                mainProgressValue: FULL_FILL_VALUE,
            });
        });

        test('should keep main segment empty when min === max and count < min', () => {
            // minPartitions = 5, maxPartitions = 5, partitionsCount = 3
            const res = calcPartitionsProgress(5, 5, 3);

            expect(res).toEqual({
                min: 5,
                max: 5,

                partitionsBelowMin: 2,
                partitionsAboveMax: 0,

                isBelowMin: true,
                isAboveMax: false,

                leftSegmentUnits: 2,
                mainSegmentUnits: 1,
                rightSegmentUnits: 0,

                mainProgressValue: 0,
            });
        });

        test('should show right overflow and fill main when min === max and count > max', () => {
            // minPartitions = 5, maxPartitions = 5, partitionsCount = 7
            const res = calcPartitionsProgress(5, 5, 7);

            expect(res).toEqual({
                min: 5,
                max: 5,

                partitionsBelowMin: 0,
                partitionsAboveMax: 2,

                isBelowMin: false,
                isAboveMax: true,

                leftSegmentUnits: 0,
                mainSegmentUnits: 1,
                rightSegmentUnits: 2,

                mainProgressValue: FULL_FILL_VALUE,
            });
        });

        test('should clamp maxPartitions to minPartitions when max < min', () => {
            // minPartitions = 5, maxPartitions = 2, partitionsCount = 6
            const res = calcPartitionsProgress(5, 2, 6);

            expect(res.min).toBe(5);
            expect(res.max).toBe(5);
        });
    });

    describe('min clamping', () => {
        test('should clamp minPartitions to at least 1', () => {
            // minPartitions = 0, partitionsCount = 1
            const res = calcPartitionsProgress(0, undefined, 1);
            expect(res.min).toBe(1);
        });
    });
});
