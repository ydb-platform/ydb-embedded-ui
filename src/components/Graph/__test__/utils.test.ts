import {getLayoutSignature, prepareBlocks} from '../utils';

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

describe('getLayoutSignature', () => {
    const block = (id: string, x: number) => ({id, x, y: 0, width: 100, height: 40}) as any;
    const edge = (from: string, to: string) => ({sourceBlockId: from, targetBlockId: to}) as any;

    test('matches an identical layout', () => {
        const a = getLayoutSignature([block('1', 0), block('2', 200)], [edge('1', '2')]);
        const b = getLayoutSignature([block('1', 0), block('2', 200)], [edge('1', '2')]);
        expect(a).toBe(b);
    });

    test('differs when the edges change between the same blocks', () => {
        const chain = getLayoutSignature(
            [block('1', 0), block('2', 0), block('3', 0)],
            [edge('1', '2'), edge('2', '3')],
        );
        const fork = getLayoutSignature(
            [block('1', 0), block('2', 0), block('3', 0)],
            [edge('1', '2'), edge('1', '3')],
        );
        expect(chain).not.toBe(fork);
    });

    test('differs when a block moves or resizes', () => {
        const base = getLayoutSignature([block('1', 0)], []);
        expect(base).not.toBe(getLayoutSignature([block('1', 40)], []));
        expect(base).not.toBe(getLayoutSignature([{...block('1', 0), height: 80} as any], []));
    });

    test('differs when a block is added or removed', () => {
        expect(getLayoutSignature([block('1', 0)], [])).not.toBe(
            getLayoutSignature([block('1', 0), block('2', 200)], []),
        );
        expect(getLayoutSignature([], [])).not.toBe(getLayoutSignature([block('1', 0)], []));
    });
});
