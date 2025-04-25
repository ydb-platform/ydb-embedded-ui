import type {TopicDataResponse, TopicMessage} from '../../../../../types/api/topic';
import {prepareResponse} from '../getData';
import {TOPIC_DATA_FETCH_LIMIT} from '../utils/constants';

describe('prepareResponse', () => {
    // Test case 1: Normal case with no removed messages
    test('should handle case with no removed messages', () => {
        const response: TopicDataResponse = {
            StartOffset: '100',
            EndOffset: '120',
            Messages: [{Offset: '100'}, {Offset: '101'}, {Offset: '102'}] as TopicMessage[],
        };

        const result = prepareResponse(response, 100);

        expect(result.start).toBe(100);
        expect(result.end).toBe(120);
        expect(result.messages.length).toBe(3);
        expect(result.messages[0]).toEqual({Offset: '100'});
        expect(result.messages[1]).toEqual({Offset: '101'});
        expect(result.messages[2]).toEqual({Offset: '102'});
    });

    // Test case 2: Case with some removed messages
    test('should handle case with some removed messages', () => {
        const response: TopicDataResponse = {
            StartOffset: '105',
            EndOffset: '120',
            Messages: [{Offset: '105'}, {Offset: '106'}, {Offset: '107'}] as TopicMessage[],
        };

        const result = prepareResponse(response, 100);

        expect(result.start).toBe(105);
        expect(result.end).toBe(120);
        expect(result.messages.length).toBe(8); // 5 removed + 3 actual

        // Check removed messages
        expect(result.messages[0]).toEqual({Offset: '<removed> 100'});
        expect(result.messages[1]).toEqual({Offset: '<removed> 101'});
        expect(result.messages[2]).toEqual({Offset: '<removed> 102'});
        expect(result.messages[3]).toEqual({Offset: '<removed> 103'});
        expect(result.messages[4]).toEqual({Offset: '<removed> 104'});

        // Check actual messages
        expect(result.messages[5]).toEqual({Offset: '105'});
        expect(result.messages[6]).toEqual({Offset: '106'});
        expect(result.messages[7]).toEqual({Offset: '107'});
    });

    // Test case 3: Case with more removed messages than the limit
    test('should handle case with more removed messages than the limit', () => {
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
            expect(result.messages[i]).toEqual({Offset: `<removed> ${100 + i}`});
        }
    });

    // Test case 4: Case with non-numeric offsets
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

        // Since start (0) < offset (100), removedMessagesCount is negative
        // No removed messages should be added
        expect(result.messages.length).toBe(2);
        expect(result.messages[0]).toEqual({Offset: '100'});
        expect(result.messages[1]).toEqual({Offset: '101'});
    });

    // Test case 5: Case with empty Messages array
    test('should handle case with empty Messages array', () => {
        const response: TopicDataResponse = {
            StartOffset: '100',
            EndOffset: '100',
            Messages: [],
        };

        const result = prepareResponse(response, 100);

        expect(result.start).toBe(100);
        expect(result.end).toBe(100);
        expect(result.messages.length).toBe(0);
    });

    // Test case 6: Case with more messages than the limit
    test('should handle case with more messages than the limit', () => {
        // Create an array of 30 messages (more than TOPIC_DATA_FETCH_LIMIT)
        const messages: TopicMessage[] = [];
        for (let i = 0; i < TOPIC_DATA_FETCH_LIMIT + 1; i++) {
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

    // Test case 7: Case with both removed messages and actual messages within limit
    test('should handle case with both removed and actual messages within limit', () => {
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
    });
});
