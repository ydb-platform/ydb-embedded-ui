import {
    getGraphColors,
    getGraphColorsFromElement,
    normalizeCssColor,
    prepareGraphOptions,
} from './colors';

describe('normalizeCssColor', () => {
    test('converts modern rgb syntax to a format compatible with paranoid', () => {
        expect(normalizeCssColor('rgb(35 29 52 / 0.15)')).toBe('rgba(35, 29, 52, 0.15)');
    });

    test('keeps an invalid color unchanged', () => {
        expect(normalizeCssColor('not-a-color')).toBe('not-a-color');
    });
});

describe('getGraphColors', () => {
    test('normalizes mapped and dynamically requested Gravity UI colors', () => {
        const variables: Record<string, string> = {
            '--g-color-line-generic': 'rgb(35 29 52 / 0.15)',
            '--g-color-base-positive-heavy': 'rgb(82 130 255 / 0.4)',
        };
        const colors = getGraphColors((name) => variables[name] ?? '');

        expect(colors.buttonBorderColor).toBe('rgba(35, 29, 52, 0.15)');
        expect(colors.getCommonColor('base-positive-heavy')).toBe('rgba(82, 130, 255, 0.4)');
    });
});

describe('getGraphColorsFromElement', () => {
    test('reads CSS variables from the supplied graph element instead of the body', () => {
        document.body.style.setProperty('--g-color-text-positive', 'rgb(255 0 0)');
        const graphRoot = document.createElement('div');
        graphRoot.style.setProperty('--g-color-text-positive', 'rgb(0 128 0)');
        document.body.append(graphRoot);

        try {
            const colors = getGraphColorsFromElement(graphRoot);

            expect(colors.success).toBe('rgb(0, 128, 0)');
        } finally {
            graphRoot.remove();
            document.body.style.removeProperty('--g-color-text-positive');
        }
    });
});

describe('prepareGraphOptions', () => {
    test('adds normalized colors without overriding options supplied by a caller', () => {
        const variables: Record<string, string> = {
            '--g-color-base-generic-ultralight': 'rgb(35 29 52 / 0.15)',
            '--g-color-base-float': 'rgb(255 255 255)',
        };
        const graphColors = getGraphColors((name) => variables[name] ?? '');
        const options = prepareGraphOptions(
            {
                initialZoomFitsCanvas: true,
                colors: {
                    nodeFill: '#abcdef',
                },
            },
            graphColors,
        );

        expect(options).toMatchObject({
            initialZoomFitsCanvas: true,
            colors: {
                fill: 'rgba(35, 29, 52, 0.15)',
                nodeFill: '#abcdef',
                getCommonColor: graphColors.getCommonColor,
            },
        });
    });
});
