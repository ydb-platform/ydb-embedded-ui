jest.mock('../utils/zod/configureZod', () => ({
    configureZod: jest.fn(),
}));

import {getQueryTextTabTitle, useOpenExternalQueryInEditor} from '../lib';
import type {ExternalQueryToOpen} from '../lib';

describe('public library exports', () => {
    test('exports the query editor opening API', () => {
        const query: ExternalQueryToOpen = {
            title: 'Select query',
            input: 'SELECT 1;',
        };

        expect(useOpenExternalQueryInEditor).toEqual(expect.any(Function));
        expect(getQueryTextTabTitle(query.input)).toBe('SELECT 1;');
    });
});
