import type {GraphNode} from '@gravity-ui/paranoid';

export const renderExplainNode = (node: GraphNode): string => {
    const parts = node.name.split('|');
    return parts.length > 1 ? parts[1] : node.name;
};

export function getColors() {
    const colorsMap: Record<string, string> = {
        success: '--g-color-text-positive',
        error: '--g-color-text-danger',
        warning: '--g-color-text-warning',
        errorBackground: '--g-color-base-danger-medium',
        warningBackground: '--g-color-base-warning-medium',
        mute: '--g-color-line-generic',
        stroke: '--g-color-text-hint',
        fill: '--g-color-base-generic-ultralight',
        nodeFill: '--g-color-base-float',
        nodeShadow: '--g-color-sfx-shadow',
        titleColor: '--g-color-text-primary',
        textColor: '--g-color-text-complementary',
        buttonBorderColor: '--g-color-line-generic',
        // groupBorderColor: '--g-color-celestial-thunder',
        // groupFill: '--g-color-celestial',
        titleHoverColor: '--g-color-text-link-hover',
        nodeHover: '--g-color-base-float-hover',
        specialHover: '--g-color-line-focus',
    };

    const style = getComputedStyle(document.body);
    const colors = Object.keys(colorsMap).reduce(
        (acc, key) => {
            const color = style.getPropertyValue(colorsMap[key]).replace(/ /g, '');
            if (color) {
                acc[key] = color;
            }
            return acc;
        },
        {} as Record<string, string>,
    );

    const getCommonColor = (name: string) => {
        return style.getPropertyValue(`--g-color-${name}`).replace(/ /g, '');
    };

    return {...colors, getCommonColor};
}
