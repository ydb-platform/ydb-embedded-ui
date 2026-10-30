import type {TNodeInfo, TSystemStateInfo} from '../types/api/nodes';

export type DatacenterColorIndexes = Readonly<Record<string, number>>;

// Base hues in priority order; every appearance uses the same hue sequence.
export const DATACENTER_COLORS = [
    'turquoise',
    'purple',
    'blue',
    'orange',
    'red',
    'pink',
    'sky',
    'brown',
    'green',
    'yellow',
    'sage',
    'slate',
] as const;

export type DatacenterColor = (typeof DATACENTER_COLORS)[number] | 'neutral';

const DATACENTER_COLOR_VARIANTS = ['soft', 'outline', 'filled-outline'] as const;
export type DatacenterColorVariant = (typeof DATACENTER_COLOR_VARIANTS)[number];

const DATACENTER_PALETTE = DATACENTER_COLOR_VARIANTS.flatMap((variant) =>
    DATACENTER_COLORS.map((color) => ({color, variant})),
);

export function normalizeDatacenter(name?: string) {
    return name ? name.toUpperCase() : undefined;
}

/** Keep the nameservice's full identity, including a bridge pile with an empty DC. */
export function getDatacenterKey(location?: TSystemStateInfo['Location'], fallback?: string) {
    const dc = location?.DataCenter || fallback;
    if (location?.BridgePileName && !dc?.toUpperCase().startsWith('P=')) {
        return normalizeDatacenter(`P=${location.BridgePileName}/${dc || ''}`);
    }
    return normalizeDatacenter(dc);
}

export function getNodeDatacenterKey(node: Pick<TNodeInfo, 'SystemState' | 'PileName'>) {
    return getDatacenterKey(
        {
            ...node.SystemState?.Location,
            BridgePileName: node.SystemState?.Location?.BridgePileName || node.PileName,
        },
        node.SystemState?.DataCenter,
    );
}

/** Extend existing assignments without renumbering previously encountered DCs. */
export function createDatacenterColorIndexes(
    names: readonly (string | undefined)[],
    configuredIndexes: DatacenterColorIndexes = {},
): DatacenterColorIndexes {
    const normalized = names.map(normalizeDatacenter).filter((name) => name !== undefined);
    const indexes = {...configuredIndexes};
    let lastIndex = Object.values(indexes).reduce(
        (max, index) => (Number.isInteger(index) && index > max ? index : max),
        0,
    );
    // Preserve configured and accumulated assignments, including absent DCs.
    // Sort only the new batch; later responses must not change earlier colors.
    for (const name of [...new Set(normalized)].sort()) {
        if (!Object.hasOwn(indexes, name)) {
            indexes[name] = ++lastIndex;
        }
    }
    return indexes;
}

function getDatacenterColorIndex(name?: string, indexes?: DatacenterColorIndexes) {
    const key = normalizeDatacenter(name);
    const index = key && indexes && Object.hasOwn(indexes, key) ? indexes[key] : undefined;
    return typeof index === 'number' && Number.isInteger(index) && index > 0 ? index : undefined;
}

export function getDatacenterColor(
    name?: string,
    indexes?: DatacenterColorIndexes,
): DatacenterColor {
    const index = getDatacenterColorIndex(name, indexes);
    return index === undefined
        ? 'neutral'
        : (DATACENTER_PALETTE[(index - 1) % DATACENTER_PALETTE.length]?.color ?? 'neutral');
}

export function getDatacenterColorVariant(
    name?: string,
    indexes?: DatacenterColorIndexes,
): DatacenterColorVariant {
    const index = getDatacenterColorIndex(name, indexes);
    if (index === undefined) {
        return 'soft';
    }
    return DATACENTER_PALETTE[(index - 1) % DATACENTER_PALETTE.length]?.variant ?? 'soft';
}
