import type {
    UnipikaList,
    UnipikaMap,
    UnipikaMapKey,
    UnipikaPrimitive,
    UnipikaSettings,
    UnipikaString,
    UnipikaValue,
} from './StructuredYsonTypes';
import {unipika} from './unipika';

export type BlockType = 'object' | 'array';

export interface UnipikaFlattenTreeItem {
    level: number;
    open?: BlockType;
    close?: BlockType;
    depth?: number;

    path?: string; // if present the block is collapsible/expandable

    key?: UnipikaMapKey;

    value?: UnipikaString | UnipikaPrimitive;

    hasDelimiter?: boolean;

    collapsed?: boolean;
}

export type UnipikaFlattenTree = Array<UnipikaFlattenTreeItem>;

interface FlattenUnipikaOptions {
    collapsedState?: CollapsedState;
    matchedState?: {};
    settings?: UnipikaSettings;
    filter?: string;
    caseSensitive?: boolean;
}

export interface FlattenUnipikaResult {
    data: UnipikaFlattenTree;
    searchIndex: {[index: number]: SearchInfo};
}

export function flattenUnipika(
    value: UnipikaValue,
    options?: FlattenUnipikaOptions,
): FlattenUnipikaResult {
    const collapsedState = options?.collapsedState || {};
    const ctx = {
        dst: [],
        levels: [],
        path: [],
        collapsedState,
        matchedPath: '',
        collapsedPath: '',
    };
    flattenUnipikaImpl(value, 0, ctx);
    const searchIndex = makeSearchIndex(ctx.dst, options?.filter, {
        settings: options?.settings,
        caseSensitive: options?.caseSensitive,
    });
    return {data: ctx.dst, searchIndex};
}

interface LevelInfo {
    type: BlockType;
    length: number;
    currentIndex: number;
}

interface FlatContext {
    readonly collapsedState: CollapsedState;

    dst: UnipikaFlattenTree;
    levels: Array<LevelInfo>;
    path: Array<string>;
    collapsedPath: string;
}

export type CollapsedState = {[path: string]: boolean};

function isObjectLike(type: BlockType) {
    return type === 'object';
}

function flattenUnipikaImpl(value: UnipikaValue, level: number, ctx: FlatContext): void {
    return flattenUnipikaJsonImpl(value, level, ctx);
}

function flattenUnipikaJsonImpl(value: UnipikaValue, level = 0, ctx: FlatContext): void {
    const beforeAttrs = ctx.dst.length;
    const {type} = ctx.levels[ctx.levels.length - 1] || {};
    const itemPathIndex = isObjectLike(type) ? beforeAttrs - 1 : ctx.dst.length;

    const isCollapsed = isPathCollapsed(ctx);
    const isContainerType = isValueContainenrType(value);

    let containerSize = 0;

    if (isCollapsed) {
        handleCollapsedValue(value, level, ctx);
    } else {
        const valueLevel = level;

        containerSize = handleValueBlock(isContainerType, value, valueLevel, ctx);
    }

    if (isContainerType && containerSize) {
        ctx.dst[itemPathIndex].depth = containerSize;
        handlePath(ctx, itemPathIndex); // handle 'array item'/'object field' path
    }
}

function handleValueBlock(
    isContainerType: boolean,
    value: UnipikaValue,
    valueLevel: number,
    ctx: FlatContext,
) {
    let containerSize = 0;

    const isValueCollapsed = isContainerType && isPathCollapsed(ctx);
    if (isValueCollapsed) {
        handleCollapsedValue(value, valueLevel, ctx);
    } else {
        switch (value.$type) {
            case 'map':
                handleUnipikaMap(value, valueLevel, ctx);
                containerSize = value.$value.length;
                break;
            case 'list':
                handleUnipikaList(value, valueLevel, ctx);
                containerSize = value.$value.length;
                break;
            case 'string':
                handleElement(fromUnipikaString(value, valueLevel), ctx);
                break;
            default:
                handleElement(fromUnipikaPrimitive(value, valueLevel), ctx);
                break;
        }
    }

    return containerSize;
}

function handleCollapsedValue(value: UnipikaValue, level: number, ctx: FlatContext) {
    switch (value.$type) {
        case 'map': {
            handleCollapsedBlock('object', level, ctx, value.$value.length);
            break;
        }
        case 'list': {
            handleCollapsedBlock('array', level, ctx, value.$value.length);
            break;
        }
    }
}

function handleCollapsedBlock(type: BlockType, level: number, ctx: FlatContext, depth?: number) {
    openBlock(type, level, ctx, 0);
    const item = ctx.dst[ctx.dst.length - 1];
    item.depth = depth;
    item.collapsed = true;
    handlePath(ctx, ctx.dst.length - 1);
    closeBlock(type, level, ctx);
}

function handlePath(ctx: FlatContext, index: number) {
    if (ctx.collapsedPath.length) {
        ctx.dst[index].path = ctx.collapsedPath;
    }
}

function pushPath(path: string, ctx: FlatContext) {
    ctx.path.push(path);
    ctx.collapsedPath = ctx.collapsedPath.length ? ctx.collapsedPath + '/' + path : path;
}
function popPath(ctx: FlatContext) {
    const last = ctx.path.pop();
    if (last !== undefined) {
        ctx.collapsedPath = ctx.collapsedPath.substring(
            0,
            ctx.collapsedPath.length - last.length - 1,
        );
    }
}

function isValueContainenrType(value: UnipikaValue) {
    return value.$type === 'map' || value.$type === 'list';
}

function isPathCollapsed(ctx: FlatContext) {
    return Boolean(ctx.collapsedState[ctx.collapsedPath]);
}

function openBlock(type: BlockType, level: number, ctx: FlatContext, length: number): LevelInfo {
    const {dst} = ctx;
    const last = getLastAsKey(dst);
    // for attributes level should be upper than level of key or parent array
    if (last?.key && last.level === level) {
        last.open = type;
    } else {
        dst.push({level, open: type});
    }
    const levelInfo = {type, length, currentIndex: 0};
    ctx.levels.push(levelInfo);
    return levelInfo;
}

function closeBlock(type: BlockType, level: number, ctx: FlatContext) {
    const info = ctx.levels.pop();
    if (info!.type !== type) {
        throw new Error(
            'The unipika tree cannot be converted to array, there is some mess with levels ' +
                `\n${JSON.stringify({type, level, info, ctx}, null, 2)}`,
        );
    }

    const last = ctx.dst[ctx.dst.length - 1];
    const isCloseSameAsOpen = last.level === level && last.open === type;

    const item: UnipikaFlattenTreeItem = isCloseSameAsOpen
        ? last
        : {
              level,
              close: type,
          };

    if (isDelimiterRequired(ctx)) {
        item.hasDelimiter = true;
    }

    if (isCloseSameAsOpen) {
        item.close = type;
    } else {
        ctx.dst.push(item);
    }
}

function isDelimiterRequired(ctx: FlatContext) {
    const {length, currentIndex} = ctx.levels[ctx.levels.length - 1] || {};
    return length !== undefined && currentIndex < length - 1;
}

function handleElement(value: UnipikaFlattenTreeItem, ctx: FlatContext) {
    const lastAsKey = getLastAsKey(ctx.dst);
    if (lastAsKey && !lastAsKey.open) {
        Object.assign(lastAsKey, value, {level: lastAsKey.level});
    } else {
        ctx.dst.push(value);
    }

    const last = ctx.dst[ctx.dst.length - 1];
    if (isDelimiterRequired(ctx)) {
        last.hasDelimiter = true;
    }
}

function getLastAsKey(dst: UnipikaFlattenTree) {
    const item = dst[dst.length - 1];
    return item?.key && !item?.close ? item : null;
}

function handleUnipikaMap(map: UnipikaMap, level: number, ctx: FlatContext) {
    const info = openBlock('object', level, ctx, map.$value.length);
    handleUnipikaMapImpl(map.$value, level + 1, ctx, info);
    closeBlock('object', level, ctx);
}

function handleUnipikaMapImpl(
    items: UnipikaMap['$value'],
    level: number,
    ctx: FlatContext,
    info: LevelInfo,
) {
    for (let i = 0; i < items.length; ++i) {
        const [key, value] = items[i];
        const keyItem: UnipikaFlattenTreeItem = {key, level: level};
        ctx.dst.push(keyItem);
        pushPath(key.$value, ctx);
        flattenUnipikaImpl(value, level, ctx);
        ++info.currentIndex;
        popPath(ctx);
    }
}

function handleUnipikaList(value: UnipikaList, level: number, ctx: FlatContext) {
    const {$value: items} = value;
    const info = openBlock('array', level, ctx, items.length);
    for (let i = 0; i < items.length; ++i) {
        pushPath(String(i), ctx);
        flattenUnipikaImpl(items[i], level + 1, ctx);
        ++info.currentIndex;
        popPath(ctx);
    }
    closeBlock('array', level, ctx);
}

function fromUnipikaString(value: UnipikaString, level: number): UnipikaFlattenTreeItem {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {$attributes, ...rest} = value;
    return {level: level, value: rest};
}

function fromUnipikaPrimitive(value: UnipikaPrimitive, level: number): UnipikaFlattenTreeItem {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {$attributes, ...rest} = value;
    return {level: level, value: rest};
}

interface SearchParams {
    settings?: UnipikaSettings;
    caseSensitive?: boolean;
}

export interface SearchInfo {
    keyMatch?: Array<number>;
    valueMatch?: Array<number>;
}

type SearchIndex = {[index: number]: SearchInfo};

export function makeSearchIndex(
    tree: UnipikaFlattenTree,
    filter?: string,
    options?: SearchParams,
): SearchIndex {
    if (!filter) {
        return {};
    }
    const settings = Object.assign<UnipikaSettings, UnipikaSettings | undefined, UnipikaSettings>(
        {},
        options?.settings,
        {asHTML: false},
    );
    const res: SearchIndex = {};
    for (let i = 0; i < tree.length; ++i) {
        const {key, value} = tree[i];
        const keyMatch = rowSearchInfo(key, filter, settings, options?.caseSensitive);
        const valueMatch = rowSearchInfo(value, filter, settings, options?.caseSensitive);
        if (keyMatch || valueMatch) {
            res[i] = Object.assign({}, keyMatch && {keyMatch}, valueMatch && {valueMatch});
        }
    }
    return res;
}

type SearchValue = undefined | UnipikaMapKey | UnipikaString | UnipikaPrimitive;

function rowSearchInfo(
    v: SearchValue,
    filter: string,
    settings: UnipikaSettings,
    caseSensitive?: boolean,
): Array<number> | undefined {
    if (!v) {
        return undefined;
    }
    const res = [];
    let tmp = unipika.formatValue(v, settings);
    if (!tmp) {
        return undefined;
    }
    tmp = String(tmp); //unipika.formatValue might return an instance of Number
    if (v.$type === 'string') {
        tmp = tmp.substring(1, tmp.length - 1); // skip quotes
    }
    let from = 0;
    let normolizedFilter = filter;
    if (!caseSensitive) {
        tmp = tmp.toLowerCase();
        normolizedFilter = filter.toLowerCase();
    }
    while (from >= 0 && from < tmp.length) {
        if (!caseSensitive) {
        }
        const index = tmp.indexOf(normolizedFilter, from);
        if (-1 === index) {
            break;
        }
        from = index + normolizedFilter.length;
        res.push(index);
    }
    return res.length ? res : undefined;
}
