import {
    createCombinedTopPartitionsHistoryQuery,
    createTimeConditions,
    createTopPartitionsHistoryQuery,
    createTopPartitionsOneMinuteQuery,
} from '../shardsQueryBuilders';

describe('createTopPartitionsOneMinuteQuery', () => {
    it('queries top_partitions_one_minute table', () => {
        const query = createTopPartitionsOneMinuteQuery({
            databaseFullPath: '/Root/db',
        });

        expect(query).toContain('.sys/top_partitions_one_minute');
        expect(query).not.toContain('.sys/top_partitions_one_hour');
    });

    it('includes time conditions in WHERE clause', () => {
        const timeConditions = createTimeConditions(
            new Date('2024-01-15T10:00:00Z').getTime(),
            new Date('2024-01-15T10:30:00Z').getTime(),
        );
        const query = createTopPartitionsOneMinuteQuery({
            databaseFullPath: '/Root/db',
            timeConditions,
        });

        expect(query).toContain('WHERE');
        expect(query).toContain('IntervalEnd');
    });

    it('includes path condition and time conditions', () => {
        const query = createTopPartitionsOneMinuteQuery({
            databaseFullPath: '/Root/db',
            path: '/Root/db/table1',
            timeConditions: "IntervalEnd > Timestamp('2024-01-15T10:00:00.000Z')",
        });

        expect(query).toContain("Path='/Root/db/table1'");
        expect(query).toContain('IntervalEnd');
    });
});

describe('createCombinedTopPartitionsHistoryQuery', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('uses only top_partitions_one_hour when time range is before current hour', () => {
        // Current time: 2024-01-15 14:30 UTC
        jest.setSystemTime(new Date('2024-01-15T14:30:00Z'));

        const query = createCombinedTopPartitionsHistoryQuery({
            databaseFullPath: '/Root/db',
            // Range: 12:00 to 13:00 (entirely before current hour 14:00)
            from: new Date('2024-01-15T12:00:00Z').getTime(),
            to: new Date('2024-01-15T13:00:00Z').getTime(),
        });

        expect(query).toContain('.sys/top_partitions_one_hour');
        expect(query).not.toContain('.sys/top_partitions_one_minute');
        expect(query).not.toContain('UNION ALL');
    });

    it('uses only top_partitions_one_minute when time range is within current hour', () => {
        // Current time: 2024-01-15 14:30 UTC
        jest.setSystemTime(new Date('2024-01-15T14:30:00Z'));

        const query = createCombinedTopPartitionsHistoryQuery({
            databaseFullPath: '/Root/db',
            // Range: 14:05 to 14:25 (entirely within current hour)
            from: new Date('2024-01-15T14:05:00Z').getTime(),
            to: new Date('2024-01-15T14:25:00Z').getTime(),
        });

        expect(query).toContain('.sys/top_partitions_one_minute');
        expect(query).not.toContain('.sys/top_partitions_one_hour');
        expect(query).not.toContain('UNION ALL');
    });

    it('uses UNION ALL when time range spans current hour boundary', () => {
        // Current time: 2024-01-15 14:30 UTC
        jest.setSystemTime(new Date('2024-01-15T14:30:00Z'));

        const query = createCombinedTopPartitionsHistoryQuery({
            databaseFullPath: '/Root/db',
            // Range: 13:00 to 14:25 (spans into current hour)
            from: new Date('2024-01-15T13:00:00Z').getTime(),
            to: new Date('2024-01-15T14:25:00Z').getTime(),
        });

        expect(query).toContain('.sys/top_partitions_one_hour');
        expect(query).toContain('.sys/top_partitions_one_minute');
        expect(query).toContain('UNION ALL');
    });

    it('UNION ALL query splits time conditions at the current hour boundary', () => {
        // Current time: 2024-01-15 14:30 UTC
        jest.setSystemTime(new Date('2024-01-15T14:30:00Z'));

        const query = createCombinedTopPartitionsHistoryQuery({
            databaseFullPath: '/Root/db',
            from: new Date('2024-01-15T12:00:00Z').getTime(),
            to: new Date('2024-01-15T14:25:00Z').getTime(),
        });

        // Hourly part: from 12:00 to 14:00 (current hour start)
        expect(query).toContain("IntervalEnd <= Timestamp('2024-01-15T14:00:00.000Z')");
        // Minute part: from 14:00 to 14:25
        expect(query).toContain("IntervalEnd > Timestamp('2024-01-15T14:00:00.000Z')");
        expect(query).toContain("IntervalEnd <= Timestamp('2024-01-15T14:25:00.000Z')");
    });

    it('uses only one_hour when to equals current hour start', () => {
        // Current time: 2024-01-15 14:30 UTC
        jest.setSystemTime(new Date('2024-01-15T14:30:00Z'));

        const query = createCombinedTopPartitionsHistoryQuery({
            databaseFullPath: '/Root/db',
            from: new Date('2024-01-15T12:00:00Z').getTime(),
            to: new Date('2024-01-15T14:00:00Z').getTime(),
        });

        expect(query).toContain('.sys/top_partitions_one_hour');
        expect(query).not.toContain('.sys/top_partitions_one_minute');
        expect(query).not.toContain('UNION ALL');
    });

    it('uses only one_minute when from equals current hour start', () => {
        // Current time: 2024-01-15 14:30 UTC
        jest.setSystemTime(new Date('2024-01-15T14:30:00Z'));

        const query = createCombinedTopPartitionsHistoryQuery({
            databaseFullPath: '/Root/db',
            from: new Date('2024-01-15T14:00:00Z').getTime(),
            to: new Date('2024-01-15T14:25:00Z').getTime(),
        });

        expect(query).toContain('.sys/top_partitions_one_minute');
        expect(query).not.toContain('.sys/top_partitions_one_hour');
        expect(query).not.toContain('UNION ALL');
    });

    it('includes path condition in all parts of UNION ALL query', () => {
        jest.setSystemTime(new Date('2024-01-15T14:30:00Z'));

        const query = createCombinedTopPartitionsHistoryQuery({
            databaseFullPath: '/Root/db',
            path: '/Root/db/myTable',
            from: new Date('2024-01-15T12:00:00Z').getTime(),
            to: new Date('2024-01-15T14:25:00Z').getTime(),
        });

        // Path condition should appear twice (once for each part of UNION ALL)
        const pathMatches = query.match(/Path='\/Root\/db\/myTable'/g);
        expect(pathMatches).toHaveLength(2);
    });

    it('includes sort order and limit after UNION ALL', () => {
        jest.setSystemTime(new Date('2024-01-15T14:30:00Z'));

        const query = createCombinedTopPartitionsHistoryQuery({
            databaseFullPath: '/Root/db',
            from: new Date('2024-01-15T12:00:00Z').getTime(),
            to: new Date('2024-01-15T14:25:00Z').getTime(),
            sortOrder: [{columnId: 'CPUCores', order: -1}],
            limit: 10,
        });

        expect(query).toContain('UNION ALL');
        // ORDER BY and LIMIT should appear after the UNION ALL
        const unionIdx = query.indexOf('UNION ALL');
        const orderByIdx = query.indexOf('ORDER BY');
        const limitIdx = query.indexOf('LIMIT');
        expect(orderByIdx).toBeGreaterThan(unionIdx);
        expect(limitIdx).toBeGreaterThan(unionIdx);
        expect(query).toContain('LIMIT 10');
    });

    it('handles undefined from and to by using UNION ALL with both tables', () => {
        jest.setSystemTime(new Date('2024-01-15T14:30:00Z'));

        const query = createCombinedTopPartitionsHistoryQuery({
            databaseFullPath: '/Root/db',
        });

        // With no from/to, we need both tables since toTime is undefined
        // and the current hour always needs minute data
        expect(query).toContain('.sys/top_partitions_one_hour');
        expect(query).toContain('.sys/top_partitions_one_minute');
        expect(query).toContain('UNION ALL');
    });

    it('preserves existing top_partitions_one_hour query for old data', () => {
        jest.setSystemTime(new Date('2024-01-15T14:30:00Z'));

        // Existing behavior: query for the previous day
        const query = createCombinedTopPartitionsHistoryQuery({
            databaseFullPath: '/Root/db',
            from: new Date('2024-01-14T10:00:00Z').getTime(),
            to: new Date('2024-01-14T14:00:00Z').getTime(),
        });

        // Should use the same query structure as before
        const legacyQuery = createTopPartitionsHistoryQuery({
            databaseFullPath: '/Root/db',
            timeConditions: createTimeConditions(
                new Date('2024-01-14T10:00:00Z').getTime(),
                new Date('2024-01-14T14:00:00Z').getTime(),
            ),
        });

        expect(query).toEqual(legacyQuery);
    });
});
