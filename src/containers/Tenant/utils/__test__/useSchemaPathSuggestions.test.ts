import {EPathType} from '../../../../types/api/schema';
import {getPathSuggestions, splitPathInput} from '../useSchemaPathSuggestions';

const entries = [
    {Name: 'logs', PathType: EPathType.EPathTypeDir},
    {Name: 'Local', PathType: EPathType.EPathTypeDir},
    {Name: 'data', PathType: EPathType.EPathTypeDir},
    {Name: 'lookup', PathType: EPathType.EPathTypeTable},
];

describe('splitPathInput', () => {
    it('splits the value by the last slash', () => {
        expect(splitPathInput('dir/sub/na')).toEqual({
            completed: 'dir/sub/',
            segments: ['dir', 'sub'],
            namePrefix: 'na',
        });
    });

    it('handles a value without slashes', () => {
        expect(splitPathInput('na')).toEqual({completed: '', segments: [], namePrefix: 'na'});
    });

    it('ignores empty segments', () => {
        expect(splitPathInput('/dir//').segments).toEqual(['dir']);
    });
});

describe('getPathSuggestions', () => {
    it('suggests only directories by default', () => {
        expect(getPathSuggestions({value: '', entries})).toEqual([
            {value: 'data/', content: 'data'},
            {value: 'Local/', content: 'Local'},
            {value: 'logs/', content: 'logs'},
        ]);
    });

    it('filters by the name that is being typed and keeps the completed part', () => {
        expect(getPathSuggestions({value: 'dir/lo', entries})).toEqual([
            {value: 'dir/Local/', content: 'Local'},
            {value: 'dir/logs/', content: 'logs'},
        ]);
    });

    it('supports custom path types', () => {
        expect(
            getPathSuggestions({value: 'lo', entries, pathTypes: [EPathType.EPathTypeTable]}),
        ).toEqual([{value: 'lookup/', content: 'lookup'}]);
    });

    it('returns nothing without entries', () => {
        expect(getPathSuggestions({value: 'lo'})).toEqual([]);
    });
});
