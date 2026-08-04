import type {Colors, Options} from '@gravity-ui/paranoid';
import {colord} from 'colord';

type CssVariableReader = (name: string) => string;

export interface GraphColors extends Colors {
    getCommonColor(name: string): string;
}

const GRAPH_COLOR_VARIABLES = {
    success: '--g-color-text-positive',
    error: '--g-color-text-danger',
    warning: '--g-color-text-warning',
    errorBackground: '--g-color-base-danger-light',
    warningBackground: '--g-color-base-warning-light',
    mute: '--g-color-line-generic',
    stroke: '--g-color-text-hint',
    fill: '--g-color-base-generic-ultralight',
    nodeFill: '--g-color-base-float',
    nodeShadow: '--g-color-sfx-shadow',
    titleColor: '--g-color-text-primary',
    textColor: '--g-color-text-complementary',
    buttonBorderColor: '--g-color-line-generic',
    groupBorderColor: '--g-color-base-info-light-hover',
    groupFill: '--g-color-base-info-light',
    titleHoverColor: '--g-color-text-link-hover',
    nodeHover: '--g-color-base-float-hover',
    specialHover: '--g-color-line-brand',
} satisfies Record<keyof Colors, string>;

export function normalizeCssColor(color: string) {
    const value = color.trim();
    const normalizedColor = colord(value);

    return normalizedColor.isValid() ? normalizedColor.toRgbString() : value;
}

function getDefaultCssVariableReader(): CssVariableReader {
    const styles = getComputedStyle(document.body);

    return (name) => styles.getPropertyValue(name);
}

export function getGraphColors(
    readCssVariable: CssVariableReader = getDefaultCssVariableReader(),
): GraphColors {
    const colors = Object.fromEntries(
        Object.entries(GRAPH_COLOR_VARIABLES)
            .map(([key, variable]) => [key, normalizeCssColor(readCssVariable(variable))])
            .filter(([, value]) => value),
    ) as Colors;

    return {
        ...colors,
        getCommonColor: (name) => normalizeCssColor(readCssVariable(`--g-color-${name}`)),
    };
}

export function prepareGraphOptions(
    options?: Options,
    graphColors: GraphColors = getGraphColors(),
): Options {
    return {
        ...options,
        colors: {
            ...graphColors,
            ...options?.colors,
        },
    };
}
