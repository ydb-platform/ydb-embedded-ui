import type {TBlock, TConnection, TGraphConfig} from '@gravity-ui/graph';
import type {Data, GraphNode, Options, Shapes, ExplainPlanNodeData} from '@gravity-ui/paranoid';
import type {AbstractGraphColorsConfig} from './colorsConfig';

const BLOCK_TOP_PADDING = 8;
const BLOCK_LINE_HEIGHT = 16;
const BORDER_HEIGHT = 2;

const getBlockSize = (block: ExplainPlanNodeData) => {
    const ONE_LINE_HEIGHT = BLOCK_TOP_PADDING * 2 + BLOCK_LINE_HEIGHT + BORDER_HEIGHT;

    switch (block.type) {
        case 'query':
            return {
                width: 40,
                height: 40,
            };
        case 'result':
            return {
                width: 112,
                height: ONE_LINE_HEIGHT,
            };
        case 'stage':
            const operatorsLength = block.operators?.length ?? 1;
            const tablesLength = block.tables?.length ?? 0;

            return {
                width: 248,
                height:
                    BORDER_HEIGHT +
                    BLOCK_TOP_PADDING * 2 +
                    (operatorsLength + tablesLength) * BLOCK_LINE_HEIGHT,
            };
        case 'connection':
            return {
                width: 122,
                height: ONE_LINE_HEIGHT,
            };
        case 'materialize':
            return {
                width: 190,
                height: ONE_LINE_HEIGHT,
            };
        default:
            return {
                width: 100,
                height: ONE_LINE_HEIGHT,
            };
    }
};

export const prepareBlocks = (nodes: Data['nodes']): TBlock[] => {
    return nodes?.map(({data: {id, name, type, ...rest}, data}) => ({
        id: String(id),
        is: type,
        name,
        ...getBlockSize(data),
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
