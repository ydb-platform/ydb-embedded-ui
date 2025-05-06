import {getLogsLink} from '../logs';

describe('getLogsLink', () => {
    test('should insert dbName into logs URL query', () => {
        const loggingData = {
            url: 'https://logging.url/projects/kikimr/logs?from=now-1h&to=now&query=%7Bproject+%3D+%22kikimr%22%2C+service+%3D+%22ydb%22%2C+cluster+%3D+%22ydb-ru-prestable%22%7D',
        };

        const result = getLogsLink({
            logging: JSON.stringify(loggingData),
            dbName: 'testdb',
        });

        // The URL should contain the dbName in the query parameter
        expect(result).toBe(
            'https://logging.url/projects/kikimr/logs?from=now-1h&to=now&query=%7Bproject+%3D+%22kikimr%22%2C+service+%3D+%22ydb%22%2C+cluster+%3D+%22ydb-ru-prestable%22%2C+database+%3D+%22testdb%22%7D',
        );
    });

    test('should handle empty query parameters', () => {
        const loggingData = {
            url: 'https://logging.url/projects/kikimr/logs?from=now-1h&to=now&query=%7B%7D',
        };

        const result = getLogsLink({
            logging: JSON.stringify(loggingData),
            dbName: 'testdb',
        });

        // Should add dbName to empty query
        expect(result).toBe(
            'https://logging.url/projects/kikimr/logs?from=now-1h&to=now&query=%7Bdatabase+%3D+%22testdb%22%7D',
        );
    });

    test('should generate monitoring URL when monium_cluster is present', () => {
        const loggingData = {
            url: 'https://logging.url/projects/some_project/logs',
            monium_cluster: 'ydb-ru-prestable',
        };

        const result = getLogsLink({
            logging: JSON.stringify(loggingData),
            dbName: 'testdb',
        });

        expect(result).toBe(
            'https://logging.url/projects/kikimr/logs?query=%7Bproject+%3D+%22kikimr%22%2C+service+%3D+%22ydb%22%2C+cluster+%3D+%22ydb-ru-prestable%22%2C+database+%3D+%22testdb%22%7D&from=now-1d&to=now&columns=level%2Ctime%2Cmessage%2Chost&groupByField=level&chartType=line&linesMode=single',
        );
    });

    test('should return empty string for invalid data', () => {
        expect(
            getLogsLink({
                logging: 'invalid json',
                dbName: 'testdb',
            }),
        ).toBe('');

        expect(
            getLogsLink({
                logging: JSON.stringify({}),
                dbName: 'testdb',
            }),
        ).toBe('');
    });
});
