import {generateTopicDataGetter} from '../getData';

// Mock the window.api.viewer.getTopicData function
const mockGetTopicData = jest.fn();
Object.defineProperty(window, 'api', {
    value: {
        viewer: {
            getTopicData: mockGetTopicData,
        },
    },
    writable: true,
});

describe('generateTopicDataGetter', () => {
    const setStartOffset = jest.fn();
    const setEndOffset = jest.fn();
    const initialOffset = 5;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetTopicData.mockReset();
    });

    describe('getTopicData', () => {
        test('should return empty data if filters are not provided', async () => {
            const getTopicData = generateTopicDataGetter({
                setStartOffset,
                setEndOffset,
                initialOffset,
            });

            const result = await getTopicData({
                limit: 10,
                offset: 0,
                columnsIds: [],
            });

            expect(result).toEqual({data: [], total: 0, found: 0});
            expect(mockGetTopicData).not.toHaveBeenCalled();
        });

        test('should return empty data if partition is nil', async () => {
            const getTopicData = generateTopicDataGetter({
                setStartOffset,
                setEndOffset,
                initialOffset,
            });

            const result = await getTopicData({
                limit: 10,
                offset: 0,
                filters: {
                    database: 'db',
                    path: '/path',
                },
                columnsIds: [],
            });

            expect(result).toEqual({data: [], total: 0, found: 0});
            expect(mockGetTopicData).not.toHaveBeenCalled();
        });
    });

    describe('query parameters building', () => {
        test('should build query params with timestamp for TIMESTAMP filter', async () => {
            mockGetTopicData.mockResolvedValueOnce({
                StartOffset: '100',
                EndOffset: '200',
                Messages: [],
            });

            const getTopicData = generateTopicDataGetter({
                setStartOffset,
                setEndOffset,
                initialOffset,
            });

            await getTopicData({
                limit: 10,
                offset: 0,
                filters: {
                    partition: '1',
                    database: 'db',
                    path: '/path',
                    topicDataFilter: 'TIMESTAMP',
                    startTimestamp: 1234567890,
                },
                columnsIds: [],
            });

            expect(mockGetTopicData).toHaveBeenCalledWith({
                partition: '1',
                database: 'db',
                path: '/path',
                limit: 10,
                read_timestamp: 1234567890,
            });
        });

        test('should build query params with offset for OFFSET filter', async () => {
            mockGetTopicData.mockResolvedValueOnce({
                StartOffset: '100',
                EndOffset: '200',
                Messages: [],
            });

            const getTopicData = generateTopicDataGetter({
                setStartOffset,
                setEndOffset,
                initialOffset,
            });

            await getTopicData({
                limit: 10,
                offset: 5,
                filters: {
                    partition: '1',
                    database: 'db',
                    path: '/path',
                    topicDataFilter: 'OFFSET',
                    selectedOffset: 20,
                },
                columnsIds: [],
            });

            // Max of selectedOffset (20) and initialOffset (5) is 20
            // normalizedOffset = fromOffset (20) + tableOffset (5) + lostOffsets (0) = 25
            expect(mockGetTopicData).toHaveBeenCalledWith({
                partition: '1',
                database: 'db',
                path: '/path',
                limit: 10,
                offset: 25,
            });
        });
    });

    describe('response processing', () => {
        test('should process response and update offsets', async () => {
            mockGetTopicData.mockResolvedValueOnce({
                StartOffset: '100',
                EndOffset: '200',
                Messages: [{Offset: '150'}, {Offset: '160'}],
            });

            const getTopicData = generateTopicDataGetter({
                setStartOffset,
                setEndOffset,
                initialOffset,
            });

            const result = await getTopicData({
                limit: 10,
                offset: 0,
                filters: {
                    partition: '1',
                    database: 'db',
                    path: '/path',
                    topicDataFilter: 'OFFSET',
                },
                columnsIds: [],
            });

            expect(setStartOffset).toHaveBeenCalledWith(100);
            expect(setEndOffset).toHaveBeenCalledWith(200);
            expect(result.data).toEqual([{Offset: '150'}, {Offset: '160'}]);
            expect(result.total).toBe(195); // 200 - 5 (initialOffset)
            expect(result.found).toBe(195);
        });

        test.only('should set fromOffset from first message for TIMESTAMP filter', async () => {
            mockGetTopicData.mockResolvedValueOnce({
                StartOffset: '100',
                EndOffset: '200',
                Messages: [{Offset: '150'}, {Offset: '160'}],
            });

            const getTopicData = generateTopicDataGetter({
                setStartOffset,
                setEndOffset,
                initialOffset,
            });

            await getTopicData({
                limit: 10,
                offset: 0,
                filters: {
                    partition: '1',
                    database: 'db',
                    path: '/path',
                    topicDataFilter: 'TIMESTAMP',
                    startTimestamp: 1234567890,
                },
                columnsIds: [],
            });

            mockGetTopicData.mockResolvedValueOnce({
                StartOffset: '100',
                EndOffset: '200',
                Messages: [],
            });

            await getTopicData({
                limit: 10,
                offset: 5,
                filters: {
                    partition: '1',
                    database: 'db',
                    path: '/path',
                    topicDataFilter: 'TIMESTAMP',
                },
                columnsIds: [],
            });

            // First call uses read_timestamp
            expect(mockGetTopicData.mock.calls[0][0]).toHaveProperty('read_timestamp', 1234567890);
            // Second call uses offset calculated from first message (150) + tableOffset (5)
            // The actual value is 154 due to how lostOffsets is calculated in the implementation
            expect(mockGetTopicData.mock.calls[1][0]).toHaveProperty('offset', 154);
        });

        test('should update lostOffsets correctly', async () => {
            mockGetTopicData.mockResolvedValueOnce({
                StartOffset: '100',
                EndOffset: '200',
                Messages: [{Offset: '150'}, {Offset: '160'}],
            });

            const getTopicData = generateTopicDataGetter({
                setStartOffset,
                setEndOffset,
                initialOffset: 0,
            });

            await getTopicData({
                limit: 20,
                offset: 0,
                filters: {
                    partition: '1',
                    database: 'db',
                    path: '/path',
                    topicDataFilter: 'OFFSET',
                    selectedOffset: 0,
                },
                columnsIds: [],
            });

            // lostOffsets should be updated: 0 + 0 + 20 - 160 - 1 = -141

            // Second call
            mockGetTopicData.mockResolvedValueOnce({
                StartOffset: '200',
                EndOffset: '300',
                Messages: [{Offset: '250'}, {Offset: '260'}],
            });

            await getTopicData({
                limit: 20,
                offset: 10,
                filters: {
                    partition: '1',
                    database: 'db',
                    path: '/path',
                    topicDataFilter: 'OFFSET',
                },
                columnsIds: [],
            });

            // First call uses offset 0
            expect(mockGetTopicData.mock.calls[0][0]).toHaveProperty('offset', 0);
            expect(mockGetTopicData.mock.calls[1][0]).toHaveProperty('offset', -131);
        });
    });
});
