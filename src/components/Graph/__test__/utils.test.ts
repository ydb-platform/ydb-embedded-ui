import {prepareBlocks} from '../utils';

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
