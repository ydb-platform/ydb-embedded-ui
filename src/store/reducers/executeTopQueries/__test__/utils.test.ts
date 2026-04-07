import type {IQueryResult} from '../../../../types/store/query';
import {normalizeQueryResult} from '../utils';

describe('normalizeQueryResult', () => {
    it('should remap Query to QueryText when QueryText is absent', () => {
        const input: IQueryResult = {
            resultSets: [{result: [{Query: 'SELECT 1'}]}],
        };
        const result = normalizeQueryResult(input);
        expect(result.resultSets?.[0]?.result?.[0]).toEqual({QueryText: 'SELECT 1'});
    });

    it('should not overwrite existing QueryText', () => {
        const input: IQueryResult = {
            resultSets: [{result: [{Query: 'old', QueryText: 'existing'}]}],
        };
        const result = normalizeQueryResult(input);
        expect(result.resultSets?.[0]?.result?.[0]).toEqual({
            Query: 'old',
            QueryText: 'existing',
        });
    });

    it('should remap Query to QueryText when QueryText is null', () => {
        const input: IQueryResult = {
            resultSets: [{result: [{Query: 'SELECT 1', QueryText: null}]}],
        };
        const result = normalizeQueryResult(input);
        expect(result.resultSets?.[0]?.result?.[0]).toEqual({QueryText: 'SELECT 1'});
    });

    it('should remap Query to QueryText when QueryText is empty string', () => {
        const input: IQueryResult = {
            resultSets: [{result: [{Query: 'SELECT 1', QueryText: ''}]}],
        };
        const result = normalizeQueryResult(input);
        expect(result.resultSets?.[0]?.result?.[0]).toEqual({QueryText: 'SELECT 1'});
    });

    it('should return parsed as-is when resultSets is undefined', () => {
        const input: IQueryResult = {};
        const result = normalizeQueryResult(input);
        expect(result).toBe(input);
    });

    it('should return parsed as-is when resultSets is empty', () => {
        const input: IQueryResult = {resultSets: []};
        const result = normalizeQueryResult(input);
        expect(result).toBe(input);
    });

    it('should return parsed as-is when first resultSet has no result', () => {
        const input: IQueryResult = {resultSets: [{}]};
        const result = normalizeQueryResult(input);
        expect(result).toBe(input);
    });

    it('should not mutate the original parsed object', () => {
        const input: IQueryResult = {
            resultSets: [{result: [{Query: 'SELECT 1'}]}],
        };
        const result = normalizeQueryResult(input);
        expect(result).not.toBe(input);
        expect(input.resultSets?.[0]?.result?.[0]).toEqual({Query: 'SELECT 1'});
    });

    it('should handle rows without Query field', () => {
        const input: IQueryResult = {
            resultSets: [{result: [{UserSID: 'user1'}]}],
        };
        const result = normalizeQueryResult(input);
        expect(result.resultSets?.[0]?.result?.[0]).toEqual({UserSID: 'user1'});
    });

    it('should handle mixed rows', () => {
        const input: IQueryResult = {
            resultSets: [
                {
                    result: [
                        {Query: 'SELECT 1'},
                        {QueryText: 'already mapped'},
                        {Query: 'SELECT 2', QueryText: 'existing'},
                    ],
                },
            ],
        };
        const result = normalizeQueryResult(input);
        const rows = result.resultSets?.[0]?.result;
        expect(rows?.[0]).toEqual({QueryText: 'SELECT 1'});
        expect(rows?.[1]).toEqual({QueryText: 'already mapped'});
        expect(rows?.[2]).toEqual({Query: 'SELECT 2', QueryText: 'existing'});
    });

    it('should preserve falsy Query values like 0', () => {
        const input: IQueryResult = {
            resultSets: [{result: [{Query: 0}]}],
        };
        const result = normalizeQueryResult(input);
        expect(result.resultSets?.[0]?.result?.[0]).toEqual({QueryText: 0});
    });
});
