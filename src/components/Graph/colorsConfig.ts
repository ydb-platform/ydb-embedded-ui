export type AbstractGraphColorsConfig = Partial<Record<string, Partial<Record<string, string>>>>;

export const graphColorsConfig = {
    // Default @gravity-ui/graph colors
    canvas: {
        belowLayerBackground: '#0000',
        border: '#0000',
        dots: 'var(--g-color-line-generic)',
        layerBackground: 'var(--g-color-base-background)',
    },
    connection: {
        background: 'var(--g-color-line-generic-solid)',
        hoverBackground: 'var(--g-color-line-generic-solid)',
        selectedBackground: 'var(--g-color-line-generic-solid)',
    },
} as const satisfies AbstractGraphColorsConfig;
