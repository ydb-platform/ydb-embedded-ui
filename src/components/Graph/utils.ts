import type {TBlock, TConnection, TGraphConfig} from '@gravity-ui/graph';
import type {Data, GraphNode, Options, Shapes} from '@gravity-ui/paranoid';
import type {ElkExtendedEdge, ElkNode} from 'elkjs';
import type {AbstractGraphColorsConfig} from './colorsConfig';
import {graphSizesConfig} from './sizesConfig';

export const prepareChildren = (blocks: TGraphConfig['blocks']) => {
    return blocks?.map((b) => {
        return {
            id: b.id as string,
            width: b.width,
            height: b.height,
            ports: [
                {
                    id: `port_${b.id as string}`,
                },
            ],
            // properties: {
            //     'elk.portConstraints': 'FIXED_ORDER',
            //     // 'elk.spacing.portPort': '0',
            // },
        } satisfies ElkNode;
    });
};

export const prepareEdges = (connections: TGraphConfig['connections'], skipLabels?: boolean) => {
    return connections?.map((c, i) => {
        const labelText = `label ${i}`;

        return {
            id: c.id as string,
            sources: [`port_${c.sourceBlockId as string}`],
            // sources: [c.sourceBlockId as string],
            targets: [c.targetBlockId as string],
            // labels: skipLabels ? [] : [{text: labelText, width: 50, height: 14}],
        } satisfies ElkExtendedEdge;
    });
};

export const prepareBlocks = (nodes: Data['nodes']): TBlock[] => {
    return nodes?.map(({data: {id, name, type, ...rest}}) => ({
        id: String(id),
        is: type,
        name,
        width: graphSizesConfig[type]?.width || 100,
        height: graphSizesConfig[type]?.height || 40,
        ...rest,
    }));
};

export const prepareConnections = (links: Data['links']): TConnection[] => {
    return links?.map(({from, to}) => ({
        id: `${from}:${to}`,
        sourceBlockId: from,
        targetBlockId: to,
    }));
};

function calculateCurrentCustomPropertyValue<T extends string>(
    colorSettings: Partial<Record<T, string>>,
    computedStyle: CSSStyleDeclaration,
): Partial<Record<T, string>> {
    const result: Partial<Record<T, string>> = {};

    for (const nestedKey in colorSettings) {
        if (Object.prototype.hasOwnProperty.call(colorSettings, nestedKey)) {
            const value = colorSettings[nestedKey];

            if (value !== undefined) {
                result[nestedKey] = value?.startsWith('var(')
                    ? computedStyle.getPropertyValue(value.substring(4, value.length - 1)).trim()
                    : value;
            }
        }
    }

    return result;
}

export function parseCustomPropertyValue<T extends AbstractGraphColorsConfig>(
    colors: T,
    block: HTMLElement = globalThis.document.body,
): T {
    const parsed: AbstractGraphColorsConfig = {};
    const computedStyle = window.getComputedStyle(block);

    for (const topKey in colors) {
        if (Object.prototype.hasOwnProperty.call(colors, topKey)) {
            const nestedObj = colors[topKey];

            if (nestedObj) {
                parsed[topKey] = calculateCurrentCustomPropertyValue(nestedObj, computedStyle);
            }
        }
    }

    return parsed as T;
}
