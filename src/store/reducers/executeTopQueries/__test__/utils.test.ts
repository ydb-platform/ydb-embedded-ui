import type {IQueryResult} from '../../../../types/store/query';
import {normalizeQueryResult} from '../utils';

describe('normalizeQueryResult', () => {
    it('should remap Query to QueryText when QueryText is absent', () => {
        const input: IQueryResult = {
            resultSets: [
                {
                    result: [
                        {Query: 'SELECT 1', UserSID: 'user1'},
                        {Query: 'SELECT 2', UserSID: 'user2'},
                    ],
                },
            ],
        };

        const result = normalizeQueryResult(input);

        expect(result.resultSets?.[0]?.result).toEqual([
            {QueryText: 'SELECT 1', UserSID: 'user1'},
            {QueryText: 'SELECT 2', UserSID: 'user2'},
        ]);
    });

    it('should not overwrite existing QueryText', () => {
        const input: IQueryResult = {
            resultSets: [
                {
                    result: [{Query: 'old query', QueryText: 'existing text', UserSID: 'user1'}],
                },
            ],
        };

        const result = normalizeQueryResult(input);

        expect(result.resultSets?.[0]?.result?.[0]).toEqual({
            Query: 'old query',
            QueryText: 'existing text',
            UserSID: 'user1',
        });
    });

    it('should remap when QueryText is null', () => {
        const input: IQueryResult = {
            resultSets: [
                {
                    result: [{Query: 'SELECT 1', QueryText: null}],
                },
            ],
        };

        const result = normalizeQueryResult(input);

        expect(result.resultSets?.[0]?.result?.[0]).toEqual({QueryText: 'SELECT 1'});
    });

    it('should remap when QueryText is empty string', () => {
        const input: IQueryResult = {
            resultSets: [
                {
                    result: [{Query: 'SELECT 1', QueryText: ''}],
                },
            ],
        };

        const result = normalizeQueryResult(input);

        expect(result.resultSets?.[0]?.result?.[0]).toEqual({QueryText: 'SELECT 1'});
    });

    it('should handle rows without Query field', () => {
        const input: IQueryResult = {
            resultSets: [
                {
                    result: [{QueryText: 'already normalized', UserSID: 'user1'}],
                },
            ],
        };

        const result = normalizeQueryResult(input);

        expect(result.resultSets?.[0]?.result?.[0]).toEqual({
            QueryText: 'already normalized',
            UserSID: 'user1',
        });
    });

    it('should return parsed unchanged when resultSets is undefined', () => {
        const input: IQueryResult = {};

        const result = normalizeQueryResult(input);

        expect(result).toEqual({});
    });

    it('should return parsed unchanged when resultSets is empty', () => {
        const input: IQueryResult = {resultSets: []};

        const result = normalizeQueryResult(input);

        expect(result).toEqual({resultSets: []});
    });

    it('should return parsed unchanged when first result set has no result', () => {
        const input: IQueryResult = {
            resultSets: [{columns: [{name: 'col', type: 'String'}]}],
        };

        const result = normalizeQueryResult(input);

        expect(result).toEqual(input);
    });

    it('should not mutate the original input', () => {
        const row = {Query: 'SELECT 1', UserSID: 'user1'};
        const input: IQueryResult = {
            resultSets: [{result: [row]}],
        };

        normalizeQueryResult(input);

        expect(row).toEqual({Query: 'SELECT 1', UserSID: 'user1'});
        expect(input.resultSets?.[0]?.result?.[0]).toBe(row);
    });

    it('should only normalize the first result set', () => {
        const input: IQueryResult = {
            resultSets: [{result: [{Query: 'SELECT 1'}]}, {result: [{Query: 'SELECT 2'}]}],
        };

        const result = normalizeQueryResult(input);

        expect(result.resultSets?.[0]?.result?.[0]).toEqual({QueryText: 'SELECT 1'});
        expect(result.resultSets?.[1]?.result?.[0]).toEqual({Query: 'SELECT 2'});
    });

    it('should handle mixed rows — some with Query, some with QueryText', () => {
        const input: IQueryResult = {
            resultSets: [
                {
                    result: [
                        {Query: 'needs remap'},
                        {QueryText: 'already has it'},
                        {Query: 'also needs remap', QueryText: 'but already set'},
                    ],
                },
            ],
        };

        const result = normalizeQueryResult(input);
        const rows = result.resultSets?.[0]?.result;

        expect(rows?.[0]).toEqual({QueryText: 'needs remap'});
        expect(rows?.[1]).toEqual({QueryText: 'already has it'});
        expect(rows?.[2]).toEqual({
            Query: 'also needs remap',
            QueryText: 'but already set',
        });
    });

    it('should preserve falsy Query values like empty string', () => {
        const input: IQueryResult = {
            resultSets: [{result: [{Query: ''}]}],
        };

        const result = normalizeQueryResult(input);

        expect(result.resultSets?.[0]?.result?.[0]).toEqual({QueryText: ''});
    });
});
