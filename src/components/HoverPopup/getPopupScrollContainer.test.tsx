import {ThemeProvider} from '@gravity-ui/uikit';
import {fireEvent, render, screen} from '@testing-library/react';

import {ContentWithPopup} from '../ContentWithPopup/ContentWithPopup';

import {getPopupScrollContainer} from './getPopupScrollContainer';

function makeScrollable(element: HTMLElement) {
    element.style.setProperty('overflow-y', 'auto');
    Object.defineProperties(element, {
        clientHeight: {value: 100},
        scrollHeight: {value: 200},
    });
}

test('preserves document portals and keeps fullscreen portals inside the fullscreen boundary', () => {
    const outer = document.createElement('div');
    const fullscreen = document.createElement('div');
    const anchor = document.createElement('span');
    document.body.append(outer);
    outer.append(fullscreen);
    fullscreen.append(anchor);
    const original = Object.getOwnPropertyDescriptors(document);
    try {
        expect(getPopupScrollContainer(null)).toBeUndefined();
        expect(getPopupScrollContainer(anchor)).toBeUndefined();
        makeScrollable(outer);
        expect(getPopupScrollContainer(anchor)).toBe(outer);
        Object.defineProperty(document, 'scrollingElement', {configurable: true, value: outer});
        expect(getPopupScrollContainer(anchor)).toBeUndefined();
        Object.defineProperty(document, 'fullscreenElement', {
            configurable: true,
            value: fullscreen,
        });
        expect(getPopupScrollContainer(anchor)).toBe(fullscreen);
    } finally {
        outer.remove();
        for (const key of ['scrollingElement', 'fullscreenElement']) {
            if (original[key]) {
                Object.defineProperty(document, key, original[key]);
            } else {
                Reflect.deleteProperty(document, key);
            }
        }
    }
});

test.each([false, true])(
    'ContentWithPopup renders in the selected portal (override: %s)',
    async (override) => {
        const host = document.createElement('div');
        makeScrollable(host);
        document.body.append(host);
        const explicitContainer = document.createElement('div');
        document.body.append(explicitContainer);
        const view = render(
            <ThemeProvider theme="light">
                <ContentWithPopup
                    content="Popup details"
                    {...(override ? {container: explicitContainer} : {})}
                >
                    Open popup
                </ContentWithPopup>
            </ThemeProvider>,
            {container: host},
        );
        try {
            fireEvent.mouseEnter(screen.getByText('Open popup'));
            const popup = await screen.findByText('Popup details');
            expect((override ? explicitContainer : host).contains(popup)).toBe(true);
        } finally {
            view.unmount();
            host.remove();
            explicitContainer.remove();
        }
    },
);
