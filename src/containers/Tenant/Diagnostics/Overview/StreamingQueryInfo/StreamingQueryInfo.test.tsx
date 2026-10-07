import {dateTimeParse} from '@gravity-ui/date-utils';

import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';

import {prepareStreamingQueryInfo} from './StreamingQueryInfo';

function buildQueryResult(row: Record<string, string | number | null>) {
    return {
        resultSets: [
            {
                result: [row],
            },
        ],
    };
}

function formatDate(value: string | number) {
    return dateTimeParse(typeof value === 'string' ? Date.parse(value) : value)?.format(
        'YYYY-MM-DD HH:mm:ss',
    );
}

describe('prepareStreamingQueryInfo', () => {
    test('formats lifecycle timestamps with user attribution', () => {
        const result = prepareStreamingQueryInfo(
            buildQueryResult({
                CreatedAt: '2026-01-02T03:04:05Z',
                CreatedBy: 'creator',
                StartedAt: '2026-01-02T04:05:06Z',
                StartedBy: 'starter',
                ModifiedAt: '2026-01-02T05:06:07Z',
                ModifiedBy: 'editor',
                FinishedAt: '2026-01-02T06:07:08Z',
                StoppedBy: 'stopper',
                Status: 'STOPPED',
                Issues: '{}',
                Text: 'SELECT 1;',
            }),
        );

        expect(result.createdContent).toBe(`${formatDate('2026-01-02T03:04:05Z')} by creator`);
        expect(result.items.map(({name, content}) => ({name, content}))).toEqual([
            {
                name: 'Started',
                content: `${formatDate('2026-01-02T04:05:06Z')} by starter`,
            },
            {
                name: 'Modified',
                content: `${formatDate('2026-01-02T05:06:07Z')} by editor`,
            },
            {
                name: 'Stopped',
                content: `${formatDate('2026-01-02T06:07:08Z')} by stopper`,
            },
            {name: 'State', content: expect.anything()},
        ]);
        expect(result.queryText).toBe('SELECT 1;');
    });

    test('uses placeholders for lifecycle columns with null values', () => {
        const result = prepareStreamingQueryInfo(
            buildQueryResult({
                CreatedAt: null,
                CreatedBy: null,
                StartedAt: null,
                StartedBy: null,
                ModifiedAt: null,
                ModifiedBy: null,
                FinishedAt: null,
                StoppedBy: null,
                Status: 'RUNNING',
                Issues: '{}',
                Text: 'SELECT 1;',
            }),
        );

        expect(result.createdContent).toBe(EMPTY_DATA_PLACEHOLDER);
        expect(result.items.slice(0, 3)).toEqual([
            {name: 'Started', content: EMPTY_DATA_PLACEHOLDER},
            {name: 'Modified', content: EMPTY_DATA_PLACEHOLDER},
            {name: 'Stopped', content: EMPTY_DATA_PLACEHOLDER},
        ]);
    });

    test('formats numeric lifecycle timestamps instead of treating them as missing', () => {
        const createdAt = Date.UTC(2026, 0, 2, 3, 4, 5);
        const startedAt = Date.UTC(2026, 0, 2, 4, 5, 6);
        const modifiedAt = Date.UTC(2026, 0, 2, 5, 6, 7);
        const finishedAt = Date.UTC(2026, 0, 2, 6, 7, 8);
        const result = prepareStreamingQueryInfo(
            buildQueryResult({
                CreatedAt: createdAt,
                CreatedBy: 'creator',
                StartedAt: startedAt,
                StartedBy: 'starter',
                ModifiedAt: modifiedAt,
                ModifiedBy: 'editor',
                FinishedAt: finishedAt,
                StoppedBy: 'stopper',
                Status: 'STOPPED',
                Issues: '{}',
                Text: 'SELECT 1;',
            }),
        );

        expect(result.createdContent).toBe(`${formatDate(createdAt)} by creator`);
        expect(result.items.slice(0, 3)).toEqual([
            {name: 'Started', content: `${formatDate(startedAt)} by starter`},
            {name: 'Modified', content: `${formatDate(modifiedAt)} by editor`},
            {name: 'Stopped', content: `${formatDate(finishedAt)} by stopper`},
        ]);
    });

    test('omits lifecycle fields that are absent in an older schema', () => {
        const result = prepareStreamingQueryInfo(
            buildQueryResult({Status: 'RUNNING', Issues: '{}', Text: 'SELECT 1;'}),
        );

        expect(result.createdContent).toBeUndefined();
        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe('State');
    });

    test('uses the describe creation step when CreatedAt is unavailable', () => {
        const result = prepareStreamingQueryInfo(
            buildQueryResult({Status: 'RUNNING', Issues: '{}', Text: 'SELECT 1;'}),
            Date.UTC(2026, 0, 2, 3, 4, 5),
        );

        expect(result.createdContent).toBe(formatDate(Date.UTC(2026, 0, 2, 3, 4, 5)));
    });
});
