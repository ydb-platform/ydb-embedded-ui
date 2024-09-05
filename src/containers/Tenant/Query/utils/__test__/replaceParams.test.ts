import {replaceParams} from '../replaceParams'; // Adjust the import path as needed

describe('replaceParams for example.com requests', () => {
    test('replaces single parameter in URL path', () => {
        const template = 'https://example.com/users/${userId}';
        const params = {userId: '12345'};
        expect(replaceParams(template, params)).toBe('https://example.com/users/12345');
    });

    test('replaces multiple parameters in URL path and query', () => {
        const template = 'https://example.com/api/${version}/search?q=${query}&limit=${limit}';
        const params = {version: 'v1', query: 'nodejs', limit: '10'};
        expect(replaceParams(template, params)).toBe(
            'https://example.com/api/v1/search?q=nodejs&limit=10',
        );
    });

    test('handles missing parameters in complex URL', () => {
        const template = 'https://example.com/${resource}/${id}?filter=${filter}&sort=${sort}';
        const params = {resource: 'products', id: '987', sort: 'desc'};
        expect(replaceParams(template, params)).toBe(
            'https://example.com/products/987?filter=${filter}&sort=desc',
        );
    });

    test('handles empty params object', () => {
        const template = 'https://example.com/static/${path}/${file}';
        const params = {};
        expect(replaceParams(template, params)).toBe('https://example.com/static/${path}/${file}');
    });

    test('handles template with no parameters', () => {
        const template = 'https://example.com/about';
        const params = {unused: 'parameter'};
        expect(replaceParams(template, params)).toBe('https://example.com/about');
    });

    test('handles empty template string', () => {
        const template = '';
        const params = {key: 'value'};
        expect(replaceParams(template, params)).toBe('');
    });

    test('handles complex nested parameters in URL structure', () => {
        const template =
            'https://example.com/${service}/${version}/${resource}?id=${id}&type=${type}';
        const params = {
            service: 'api',
            version: 'v2',
            resource: 'users',
            id: '12345',
            type: 'admin',
        };
        expect(replaceParams(template, params)).toBe(
            'https://example.com/api/v2/users?id=12345&type=admin',
        );
    });

    test('handles URL-encoded parameters', () => {
        const template = 'https://example.com/search?q=${query}';
        const params = {query: encodeURIComponent('Hello World!')};
        expect(replaceParams(template, params)).toBe('https://example.com/search?q=Hello%20World!');
    });
});
