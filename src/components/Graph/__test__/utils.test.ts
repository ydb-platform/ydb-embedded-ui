import {isSameTopology, prepareBlocks} from '../utils';

describe('prepareBlocks', () => {
    test('reserves a name row when stage operators is an empty array', () => {
        const [block] = prepareBlocks([
            {
                name: 'stage-1',
                data: {
                    type: 'stage',
                    name: 'Empty operators stage',
                    operators: [],
                },
            },
        ]);

        expect(block.height).toBe(34);
    });
});

describe('isSameTopology', () => {
    test('detects an unchanged block set', () => {
        expect(isSameTopology(['1', '2', '3'], ['1', '2', '3'])).toBe(true);
    });

    test('detects added, removed and reordered blocks', () => {
        expect(isSameTopology(['1', '2'], ['1', '2', '3'])).toBe(false);
        expect(isSameTopology(['1', '2', '3'], ['1', '2'])).toBe(false);
        expect(isSameTopology(['1', '2'], ['2', '1'])).toBe(false);
    });

    test('treats the first layout as a change', () => {
        expect(isSameTopology([], ['1'])).toBe(false);
    });
});
