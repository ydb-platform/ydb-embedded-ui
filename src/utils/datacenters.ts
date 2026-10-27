import type {TNodeInfo, TSystemStateInfo} from '../types/api/nodes';

export type DatacenterColorIndexes = Readonly<Record<string, number>>;

// Base hues in priority order: original colors, then additional colors.
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
    // One base swatch per row of Figma's extended palette; themes share the same slot.
    'reserve-orange',
    'reserve-yellow',
    'reserve-green',
    'reserve-lightblue',
    'reserve-blue',
    'reserve-violet',
    'reserve-pink',
    'reserve-caramel',
    'reserve-moss',
    'reserve-turquoise',
    'reserve-barbie',
    'reserve-night',
] as const;

export type DatacenterColor = (typeof DATACENTER_COLORS)[number] | 'neutral';

const DATACENTER_COLOR_VARIANTS = ['soft', 'muted', 'outline'] as const;
const RESERVE_DATACENTER_COLOR_VARIANTS = ['soft', 'outline'] as const;
export type DatacenterColorVariant = (typeof DATACENTER_COLOR_VARIANTS)[number];

const PRIMARY_DATACENTER_COLORS = DATACENTER_COLORS.slice(0, 10);
const RESERVE_DATACENTER_COLORS = DATACENTER_COLORS.slice(10);
// Use every primary appearance before the additional fills and outlines.
const DATACENTER_PALETTE = [
    ...DATACENTER_COLOR_VARIANTS.flatMap((variant) =>
        PRIMARY_DATACENTER_COLORS.map((color) => ({color, variant})),
    ),
    ...RESERVE_DATACENTER_COLOR_VARIANTS.flatMap((variant) =>
        RESERVE_DATACENTER_COLORS.map((color) => ({color, variant})),
    ),
];

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

export interface DatacenterNodes {
    name?: string;
    count: number;
}

export function getDatabaseDatacenters({
    nodes = [],
    found,
}: {
    nodes?: readonly {NodeId: number; DCKey?: string}[];
    found?: number;
}): DatacenterNodes[] | undefined {
    // Never present a truncated response as the database's complete distribution.
    if (found !== nodes.length) {
        return undefined;
    }
    const counts = new Map<string | undefined, number>();
    const seen = new Set<number>();
    for (const node of nodes) {
        if (seen.has(node.NodeId)) {
            continue;
        }
        seen.add(node.NodeId);
        const name = normalizeDatacenter(node.DCKey);
        counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts]
        .sort(([a], [b]) => {
            if (a === b) {
                return 0;
            }
            if (a === undefined) {
                return 1;
            }
            if (b === undefined) {
                return -1;
            }
            return a < b ? -1 : 1;
        })
        .map(([name, count]) => ({name, count}));
}
