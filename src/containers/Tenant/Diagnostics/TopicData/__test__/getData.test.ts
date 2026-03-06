import type {TopicDataResponse, TopicMessage} from '../../../../../types/api/topic';
import {generateTopicDataGetter, prepareResponse} from '../getData';
import {TOPIC_DATA_FETCH_LIMIT} from '../utils/constants';

describe('prepareResponse', () => {
    test('should handle case with some notLoaded messages', () => {
        const response: TopicDataResponse = {
            StartOffset: '105',
            EndOffset: '120',
            Messages: [{Offset: '105'}, {Offset: '106'}, {Offset: '107'}] as TopicMessage[],
        };

        const result = prepareResponse(response, 100);

        expect(result.start).toBe(105);
        expect(result.end).toBe(120);
        expect(result.messages.length).toBe(20);

        expect(result.messages[0]).toEqual({Offset: 100, removed: true});
        expect(result.messages[1]).toEqual({Offset: 101, removed: true});
        expect(result.messages[2]).toEqual({Offset: 102, removed: true});
        expect(result.messages[3]).toEqual({Offset: 103, removed: true});
        expect(result.messages[4]).toEqual({Offset: 104, removed: true});
        expect(result.messages[5]).toEqual({Offset: '105'});
        expect(result.messages[6]).toEqual({Offset: '106'});
        expect(result.messages[7]).toEqual({Offset: '107'});
        expect(result.messages[8]).toEqual({Offset: 108, notLoaded: true});
        expect(result.messages[19]).toEqual({Offset: 119, notLoaded: true});
    });

    test('should handle case with more notLoaded messages than the limit', () => {
        const response: TopicDataResponse = {
            StartOffset: '150',
            EndOffset: '170',
            Messages: [{Offset: '150'}, {Offset: '151'}, {Offset: '152'}] as TopicMessage[],
        };

        const result = prepareResponse(response, 100);

        expect(result.start).toBe(150);
        expect(result.end).toBe(170);
        expect(result.messages.length).toBe(TOPIC_DATA_FETCH_LIMIT); // Limited by TOPIC_DATA_FETCH_LIMIT

        // All messages should be "removed" placeholders since there are more than the limit
        for (let i = 0; i < TOPIC_DATA_FETCH_LIMIT; i++) {
            expect(result.messages[i]).toEqual({Offset: 100 + i, removed: true});
        }
    });

    test('should handle case with non-numeric offsets', () => {
        const response: TopicDataResponse = {
            StartOffset: 'not-a-number',
            EndOffset: 'invalid',
            Messages: [{Offset: '100'}, {Offset: '101'}] as TopicMessage[],
        };

        const result = prepareResponse(response, 100);

        // safeParseNumber should return 0 for non-numeric values
        expect(result.start).toBe(0);
        expect(result.end).toBe(0);

        // Since end (0) <= offset (100), no messages should be processed
        expect(result.messages.length).toBe(0);
    });

    test('should handle case with empty Messages array', () => {
        const response: TopicDataResponse = {
            StartOffset: '100',
            EndOffset: '120',
            Messages: [],
        };

        const result = prepareResponse(response, 100);

        expect(result.start).toBe(100);
        expect(result.end).toBe(120);
        // end - offset = 120 - 100 = 20, which is less than TOPIC_DATA_FETCH_LIMIT (30)
        expect(result.messages.length).toBe(20);
        // All should be marked as notLoaded
        expect(result.messages[0]).toEqual({Offset: 100, notLoaded: true});
        expect(result.messages[19]).toEqual({Offset: 119, notLoaded: true});
    });

    test('should handle case with more messages than the limit', () => {
        // Create an array of 30 messages (more than TOPIC_DATA_FETCH_LIMIT)
        const messages: TopicMessage[] = [];
        for (let i = 0; i < TOPIC_DATA_FETCH_LIMIT + 10; i++) {
            messages.push({Offset: `${100 + i}`} as TopicMessage);
        }

        const response: TopicDataResponse = {
            StartOffset: '100',
            EndOffset: '130',
            Messages: messages,
        };

        const result = prepareResponse(response, 100);

        expect(result.start).toBe(100);
        expect(result.end).toBe(130);

        // Should be limited to TOPIC_DATA_FETCH_LIMIT
        expect(result.messages.length).toBe(TOPIC_DATA_FETCH_LIMIT);

        // Check the first few messages
        expect(result.messages[0]).toEqual({Offset: '100'});
        expect(result.messages[1]).toEqual({Offset: '101'});
        expect(result.messages[2]).toEqual({Offset: '102'});
    });

    test('should handle case with both notLoaded and actual messages within limit', () => {
        const response: TopicDataResponse = {
            StartOffset: '110',
            EndOffset: '130',
            Messages: Array.from({length: 15}, (_, i) => ({Offset: `${110 + i}`}) as TopicMessage),
        };

        const result = prepareResponse(response, 100);

        expect(result.start).toBe(110);
        expect(result.end).toBe(130);

        // 10 removed + 10 actual = 20 (TOPIC_DATA_FETCH_LIMIT)
        expect(result.messages.length).toBe(TOPIC_DATA_FETCH_LIMIT);

        // Check first 10 messages are marked as removed
        for (let i = 0; i < 10; i++) {
            expect(result.messages[i]).toEqual({Offset: 100 + i, removed: true});
        }

        // Check next 10 messages are actual messages
        for (let i = 0; i < 10; i++) {
            expect(result.messages[i + 10]).toEqual({Offset: `${110 + i}`});
        }
    });

    test('should handle case with gaps in message offsets', () => {
        const response: TopicDataResponse = {
            StartOffset: '100',
            EndOffset: '110',
            Messages: [
                {Offset: '100'} as TopicMessage,
                {Offset: '102'} as TopicMessage,
                {Offset: '105'} as TopicMessage,
                {Offset: '109'} as TopicMessage,
            ],
        };

        const result = prepareResponse(response, 100);

        expect(result.start).toBe(100);
        expect(result.end).toBe(110);
        expect(result.messages.length).toBe(10);

        // Check actual messages
        expect(result.messages[0]).toEqual({Offset: '100'});
        expect(result.messages[2]).toEqual({Offset: '102'});
        expect(result.messages[5]).toEqual({Offset: '105'});
        expect(result.messages[9]).toEqual({Offset: '109'});

        // Check notLoaded messages (gaps)
        expect(result.messages[1]).toEqual({Offset: 101, notLoaded: true});
        expect(result.messages[3]).toEqual({Offset: 103, notLoaded: true});
        expect(result.messages[4]).toEqual({Offset: 104, notLoaded: true});
        expect(result.messages[6]).toEqual({Offset: 106, notLoaded: true});
        expect(result.messages[7]).toEqual({Offset: 107, notLoaded: true});
        expect(result.messages[8]).toEqual({Offset: 108, notLoaded: true});
    });

    test('should handle case with offset greater than EndOffset', () => {
        const response: TopicDataResponse = {
            StartOffset: '100',
            EndOffset: '110',
            Messages: [{Offset: '100'}, {Offset: '101'}, {Offset: '102'}] as TopicMessage[],
        };

        const result = prepareResponse(response, 115);

        expect(result.start).toBe(100);
        expect(result.end).toBe(110);
        // Since offset > end, no messages should be processed
        expect(result.messages.length).toBe(0);
    });

    test('should handle case with offset equal to EndOffset', () => {
        const response: TopicDataResponse = {
            StartOffset: '100',
            EndOffset: '110',
            Messages: [{Offset: '100'}, {Offset: '101'}, {Offset: '102'}] as TopicMessage[],
        };

        const result = prepareResponse(response, 110);

        expect(result.start).toBe(100);
        expect(result.end).toBe(110);
        // Since offset = end, no messages should be processed
        expect(result.messages.length).toBe(0);
    });

    test('should handle case with undefined Messages', () => {
        const response: TopicDataResponse = {
            StartOffset: '100',
            EndOffset: '110',
            // Messages is undefined
        };

        const result = prepareResponse(response, 100);

        expect(result.start).toBe(100);
        expect(result.end).toBe(110);
        // Should have placeholders for all offsets in range
        expect(result.messages.length).toBe(10);
        // All should be marked as notLoaded
        for (let i = 0; i < 10; i++) {
            expect(result.messages[i]).toEqual({Offset: 100 + i, notLoaded: true});
        }
    });

    test('should handle zero StartOffset and EndOffset', () => {
        const response: TopicDataResponse = {
            StartOffset: '0',
            EndOffset: '10',
            Messages: [{Offset: '0'}, {Offset: '1'}, {Offset: '2'}] as TopicMessage[],
        };

        const result = prepareResponse(response, 0);

        expect(result.start).toBe(0);
        expect(result.end).toBe(10);
        // Since offset equals start, only actual messages should be returned
        expect(result.messages.length).toBe(10);
        // Check if the function correctly handles zero offsets
        expect(result.messages[0]).toEqual({Offset: '0'});
        expect(result.messages[1]).toEqual({Offset: '1'});
        expect(result.messages[2]).toEqual({Offset: '2'});
        expect(result.messages[3]).toEqual({Offset: 3, notLoaded: true});
        expect(result.messages[9]).toEqual({Offset: 9, notLoaded: true});
    });
});

describe('generateTopicDataGetter', () => {
    const baseFilters = {
        partition: '0',
        database: '/Root',
        path: '/Root/topic',
        isEmpty: false,
    };

    function makeResponse(startOffset: string, endOffset: string): TopicDataResponse {
        return {StartOffset: startOffset, EndOffset: endOffset, Messages: []};
    }

    function mockApi(response: TopicDataResponse) {
        (window as any).api = {
            viewer: {
                getTopicData: jest.fn().mockResolvedValue(response),
            },
        };
    }

    test('total and found equal end - baseOffset when maxEntities is not set', async () => {
        // end=200, baseOffset=100 → quantity = 100, no cap
        mockApi(makeResponse('100', '200'));

        const getter = generateTopicDataGetter({
            setBoundOffsets: jest.fn(),
            baseOffset: 100,
        });

        const result = await getter({limit: 30, offset: 0, columnsIds: [], filters: baseFilters});

        expect(result.total).toBe(100);
        expect(result.found).toBe(100);
    });

    test('total and found are capped to maxEntities when quantity exceeds it', async () => {
        // end=200, baseOffset=0 → quantity = 200, capped to 50
        mockApi(makeResponse('0', '200'));

        const getter = generateTopicDataGetter({
            setBoundOffsets: jest.fn(),
            baseOffset: 0,
            maxEntities: 50,
        });

        const result = await getter({limit: 30, offset: 0, columnsIds: [], filters: baseFilters});

        expect(result.total).toBe(50);
        expect(result.found).toBe(50);
    });

    test('total and found are not capped when quantity is below maxEntities', async () => {
        // end=30, baseOffset=0 → quantity = 30, maxEntities = 100 → no cap
        mockApi(makeResponse('0', '30'));

        const getter = generateTopicDataGetter({
            setBoundOffsets: jest.fn(),
            baseOffset: 0,
            maxEntities: 100,
        });

        const result = await getter({limit: 30, offset: 0, columnsIds: [], filters: baseFilters});

        expect(result.total).toBe(30);
        expect(result.found).toBe(30);
    });

    test('total and found are not capped when quantity equals maxEntities', async () => {
        // end=100, baseOffset=0 → quantity = 100, maxEntities = 100 → no cap
        mockApi(makeResponse('0', '100'));

        const getter = generateTopicDataGetter({
            setBoundOffsets: jest.fn(),
            baseOffset: 0,
            maxEntities: 100,
        });

        const result = await getter({limit: 30, offset: 0, columnsIds: [], filters: baseFilters});

        expect(result.total).toBe(100);
        expect(result.found).toBe(100);
    });

    test('total and found are never negative when end is less than baseOffset', async () => {
        // end=50, baseOffset=100 → end - baseOffset = -50, clamped to 0
        mockApi(makeResponse('0', '50'));

        const getter = generateTopicDataGetter({
            setBoundOffsets: jest.fn(),
            baseOffset: 100,
        });

        const result = await getter({limit: 30, offset: 0, columnsIds: [], filters: baseFilters});

        expect(result.total).toBeGreaterThanOrEqual(0);
        expect(result.found).toBeGreaterThanOrEqual(0);
        expect(result.total).toBe(0);
        expect(result.found).toBe(0);
    });

    test('total and found are never negative even when maxEntities is set and end < baseOffset', async () => {
        // end=10, baseOffset=200 → quantity clamped to 0, maxEntities=50 → still 0
        mockApi(makeResponse('0', '10'));

        const getter = generateTopicDataGetter({
            setBoundOffsets: jest.fn(),
            baseOffset: 200,
            maxEntities: 50,
        });

        const result = await getter({limit: 30, offset: 0, columnsIds: [], filters: baseFilters});

        expect(result.total).toBe(0);
        expect(result.found).toBe(0);
    });

    test('setBoundOffsets is called with parsed start and end from response', async () => {
        mockApi(makeResponse('10', '80'));

        const setBoundOffsets = jest.fn();
        const getter = generateTopicDataGetter({
            setBoundOffsets,
            baseOffset: 0,
        });

        await getter({limit: 30, offset: 0, columnsIds: [], filters: baseFilters});

        expect(setBoundOffsets).toHaveBeenCalledWith({startOffset: 10, endOffset: 80});
    });

    test('returns emptyData when filters are absent', async () => {
        mockApi(makeResponse('0', '100'));

        const getter = generateTopicDataGetter({
            setBoundOffsets: jest.fn(),
            baseOffset: 0,
        });

        const result = await getter({limit: 30, offset: 0, columnsIds: [], filters: undefined});

        expect(result).toEqual({data: [], total: 0, found: 0});
    });

    test('returns emptyData when partition is empty string', async () => {
        mockApi(makeResponse('0', '100'));

        const getter = generateTopicDataGetter({
            setBoundOffsets: jest.fn(),
            baseOffset: 0,
        });

        const result = await getter({
            limit: 30,
            offset: 0,
            columnsIds: [],
            filters: {...baseFilters, partition: ''},
        });

        expect(result).toEqual({data: [], total: 0, found: 0});
    });

    test('returns emptyData when isEmpty flag is true', async () => {
        mockApi(makeResponse('0', '100'));

        const getter = generateTopicDataGetter({
            setBoundOffsets: jest.fn(),
            baseOffset: 0,
        });

        const result = await getter({
            limit: 30,
            offset: 0,
            columnsIds: [],
            filters: {...baseFilters, isEmpty: true},
        });

        expect(result).toEqual({data: [], total: 0, found: 0});
    });
});
