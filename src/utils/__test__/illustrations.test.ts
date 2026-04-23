import React from 'react';

import {render} from '@testing-library/react';

import {configureUIFactory} from '../../uiFactory/uiFactory';
import {getIllustration} from '../illustrations';

describe('getIllustration', () => {
    beforeEach(() => {
        configureUIFactory({illustrations: undefined});
    });

    test('uses component from module default export', () => {
        const CustomIllustration = jest.fn(() => null);

        configureUIFactory({
            illustrations: {
                NoSearchResults: {default: CustomIllustration} as never,
            },
        });

        expect(getIllustration('NoSearchResults')).toBe(CustomIllustration);
    });

    test('supports asset module default string export', () => {
        configureUIFactory({
            illustrations: {
                NoSearchResults: {default: '/assets/no-search-results.svg'} as never,
            },
        });

        const Illustration = getIllustration('NoSearchResults');
        const rendered = React.createElement(Illustration, {width: 100, height: 100});

        expect(typeof rendered.type).toBe('function');
        expect(rendered.props.width).toBe(100);
        expect(rendered.props.height).toBe(100);

        const {container} = render(rendered);
        const imgElement = container.querySelector('img');
        expect(imgElement).not.toBeNull();
        expect(imgElement?.getAttribute('src')).toBe('/assets/no-search-results.svg');
        expect(imgElement?.getAttribute('width')).toBe('100');
        expect(imgElement?.getAttribute('height')).toBe('100');
    });
});
