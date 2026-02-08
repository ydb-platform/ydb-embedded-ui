import type {QueryTabState} from '../../../../../store/reducers/query/types';
import {getNewQueryTitle, getTabTitleForSave, isDefaultNewQueryTitle} from '../queryTabTitles';

function createTab(overrides: Partial<QueryTabState> = {}): QueryTabState {
    return {
        id: 'tab-1',
        title: '',
        input: '',
        isDirty: false,
        createdAt: 0,
        updatedAt: 0,
        ...overrides,
    };
}

describe('getNewQueryTitle', () => {
    test('returns base title for counter 0', () => {
        expect(getNewQueryTitle(0)).toBe('New Query');
    });

    test('returns indexed title for counter > 0', () => {
        expect(getNewQueryTitle(1)).toBe('New Query 1');
        expect(getNewQueryTitle(5)).toBe('New Query 5');
    });
});

describe('isDefaultNewQueryTitle', () => {
    test('returns true for base default title', () => {
        expect(isDefaultNewQueryTitle('New Query')).toBe(true);
    });

    test('returns true for indexed default titles', () => {
        expect(isDefaultNewQueryTitle('New Query 1')).toBe(true);
        expect(isDefaultNewQueryTitle('New Query 42')).toBe(true);
    });

    test('returns false for non-default titles', () => {
        expect(isDefaultNewQueryTitle('Select query')).toBe(false);
        expect(isDefaultNewQueryTitle('My custom query')).toBe(false);
        expect(isDefaultNewQueryTitle('New Query copy')).toBe(false);
    });

    test('returns false for empty string', () => {
        expect(isDefaultNewQueryTitle('')).toBe(false);
    });

    test('returns false for partial matches', () => {
        expect(isDefaultNewQueryTitle('New Query abc')).toBe(false);
        expect(isDefaultNewQueryTitle('New Query 1a')).toBe(false);
    });
});

describe('getTabTitleForSave', () => {
    test('returns undefined for undefined tab', () => {
        expect(getTabTitleForSave(undefined)).toBeUndefined();
    });

    test('returns default title for tab with empty title', () => {
        expect(getTabTitleForSave(createTab({title: ''}))).toBe('New Query');
    });

    test('returns title for tab with default "New Query" title', () => {
        expect(getTabTitleForSave(createTab({title: 'New Query'}))).toBe('New Query');
    });

    test('returns title for tab with indexed default title', () => {
        expect(getTabTitleForSave(createTab({title: 'New Query 3'}))).toBe('New Query 3');
    });

    test('returns title for user-defined tab', () => {
        const tab = createTab({title: 'My Query', isTitleUserDefined: true});
        expect(getTabTitleForSave(tab)).toBe('My Query');
    });

    test('returns title for schema action tab', () => {
        const tab = createTab({title: 'Select query'});
        expect(getTabTitleForSave(tab)).toBe('Select query');
    });

    test('returns title for history tab', () => {
        const tab = createTab({title: 'SELECT * FROM my_table'});
        expect(getTabTitleForSave(tab)).toBe('SELECT * FROM my_table');
    });

    test('returns title for duplicated tab', () => {
        const tab = createTab({title: 'New Query copy'});
        expect(getTabTitleForSave(tab)).toBe('New Query copy');
    });

    test('returns title for saved query tab', () => {
        const tab = createTab({title: 'Production monitoring'});
        expect(getTabTitleForSave(tab)).toBe('Production monitoring');
    });
});
