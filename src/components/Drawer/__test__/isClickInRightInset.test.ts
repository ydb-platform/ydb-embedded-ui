import {isClickInRightInset} from '../DrawerContext';

function createRect({
    left,
    right,
    top,
    bottom,
}: {
    left: number;
    right: number;
    top: number;
    bottom: number;
}): DOMRect {
    return {
        bottom,
        height: bottom - top,
        left,
        right,
        top,
        width: right - left,
        x: left,
        y: top,
        toJSON: () => ({}),
    };
}

describe('isClickInRightInset', () => {
    it('does not treat clicks above or below the provider as right inset clicks', () => {
        const providerContainer = document.createElement('div');
        const itemContainer = document.createElement('div');
        providerContainer.appendChild(itemContainer);

        jest.spyOn(providerContainer, 'getBoundingClientRect').mockReturnValue(
            createRect({left: 0, right: 1_000, top: 200, bottom: 600}),
        );
        jest.spyOn(itemContainer, 'getBoundingClientRect').mockReturnValue(
            createRect({left: 0, right: 700, top: 200, bottom: 600}),
        );

        expect(
            isClickInRightInset(
                new MouseEvent('click', {clientX: 750, clientY: 400}),
                itemContainer,
                300,
            ),
        ).toBe(true);
        expect(
            isClickInRightInset(
                new MouseEvent('click', {clientX: 750, clientY: 100}),
                itemContainer,
                300,
            ),
        ).toBe(false);
        expect(
            isClickInRightInset(
                new MouseEvent('click', {clientX: 750, clientY: 700}),
                itemContainer,
                300,
            ),
        ).toBe(false);
    });
});
