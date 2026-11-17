import {validateRelativePath} from '../validateRelativePath';

describe('validateRelativePath', () => {
    it('accepts a new directory name', () => {
        expect(validateRelativePath('new-dir')).toBe('');
        expect(validateRelativePath('test/new-dir', ['test/lala/'])).toBe('');
    });

    it('rejects an empty path', () => {
        expect(validateRelativePath('')).toBe('Path is empty');
    });

    it('rejects whitespace', () => {
        expect(validateRelativePath('new dir')).toBe('Whitespace is not allowed');
    });

    it('asks for a name after an existing directory picked from suggestions', () => {
        expect(validateRelativePath('test/', ['test/lala/'])).toBe(
            'Add the name of the new directory',
        );
    });

    it('rejects a directory that already exists', () => {
        expect(validateRelativePath('test', ['te/', 'test/'])).toBe('Directory already exists');
        expect(validateRelativePath('test/lala', ['test/lala/'])).toBe('Directory already exists');
    });
});
