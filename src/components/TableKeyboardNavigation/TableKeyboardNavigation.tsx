import React from 'react';

import {shouldHandleKeyboardNavigation} from './utils';

interface Scope {
    enabled: boolean;
    searches: Set<HTMLInputElement>;
    containerRef?: React.RefObject<HTMLElement>;
    adapters: Set<Adapter>;
    activeAdapter?: Adapter;
    listeners: Set<() => void>;
}

interface Adapter {
    element: HTMLElement;
    scope: Scope;
    getFirst: () => number | undefined;
    getLast: () => number | undefined;
    getNext: (index: number, step: number) => number | undefined;
    getSelected: () => number | undefined;
    select: (index: number | undefined) => void;
    activate?: (index: number) => void;
}

const ScopeContext = React.createContext<Scope | null>(null);

function isVisible(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
}

function resetScope(scope: Scope) {
    scope.activeAdapter = undefined;
    scope.adapters.forEach((adapter) => adapter.select(undefined));
}

function notifyScope(scope: Scope) {
    scope.listeners.forEach((listener) => listener());
}

function isAvailable(adapter: Adapter) {
    const {scope, element} = adapter;
    return (
        scope.enabled &&
        element.isConnected &&
        element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility === 'visible' &&
        !element.closest('[inert], [hidden], [aria-hidden="true"]') &&
        (!scope.containerRef?.current || scope.containerRef.current.contains(element))
    );
}

function resolveTable(scope: Scope, target: HTMLElement) {
    const boundary = target.closest('[data-table-keyboard-scope]');
    if (boundary && boundary !== scope.containerRef?.current) {
        return undefined;
    }
    const {activeAdapter} = scope;
    const available = Array.from(scope.adapters).filter(
        (adapter) => isAvailable(adapter) && adapter.getFirst() !== undefined,
    );
    const direct = available.find((adapter) => adapter.element.contains(target));
    const fromSearch = scope.searches.has(target as HTMLInputElement);
    const fromDocument = target === document.body || target === document.documentElement;
    // Only the registered global search may delegate text-input keys to the table.
    if (target.closest('input, [role="textbox"], [role="searchbox"]') && !fromSearch) {
        return undefined;
    }
    if (!direct && !fromSearch && !fromDocument) {
        return undefined;
    }
    if (fromDocument) {
        // Back may restore focus to body. With several independent searches, do not guess.
        const searches = Array.from(
            document.querySelectorAll<HTMLInputElement>('[data-table-keyboard-search]'),
        ).filter((search) => !search.disabled && isVisible(search));
        if (searches.length !== 1 || !scope.searches.has(searches[0])) {
            return undefined;
        }
    }
    const tables = available.sort((a, b) => {
        // compareDocumentPosition returns DOM position flags.
        // eslint-disable-next-line no-bitwise
        return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING
            ? -1
            : 1;
    });
    const table =
        direct ??
        (activeAdapter && tables.includes(activeAdapter)
            ? activeAdapter
            : (tables.find((adapter) => isVisible(adapter.element)) ?? tables[0]));
    if (!table) {
        return undefined;
    }
    return {table, tables};
}

function handleKeyDown(scope: Scope, event: KeyboardEvent) {
    if (
        !scope.enabled ||
        !Array.from(scope.searches).some((search) => search.isConnected && !search.disabled) ||
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        !['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key) ||
        !(event.target instanceof HTMLElement) ||
        !shouldHandleKeyboardNavigation(event.target)
    ) {
        return;
    }
    const resolved = resolveTable(scope, event.target);
    if (!resolved) {
        // Keep the search caret stable when filtering leaves no navigable rows.
        if (event.key !== 'Enter' && scope.searches.has(event.target as HTMLInputElement)) {
            event.preventDefault();
        }
        return;
    }
    const {table, tables} = resolved;
    if (event.key === 'Enter') {
        if (table.activate) {
            event.preventDefault();
            const index = table.getSelected() ?? table.getFirst();
            if (!event.repeat && index !== undefined) {
                table.activate(index);
            }
        }
        return;
    }
    event.preventDefault();
    moveSelection(table, tables, event.key === 'ArrowDown' ? 1 : -1);
}

function moveSelection(table: Adapter, tables: Adapter[], step: number) {
    const selected = table.getSelected();
    const initial = selected ?? table.getFirst();
    if (initial === undefined) {
        return;
    }
    let destination = table;
    let index = table.getNext(initial, step);
    if (index === undefined && selected !== undefined) {
        const adjacent = tables[tables.indexOf(table) + step];
        const adjacentIndex = step > 0 ? adjacent?.getFirst() : adjacent?.getLast();
        if (adjacent && adjacentIndex !== undefined) {
            destination = adjacent;
            index = adjacentIndex;
        }
    }
    table.scope.activeAdapter = destination;
    for (const adapter of table.scope.adapters) {
        adapter.select(adapter === destination ? (index ?? initial) : undefined);
    }
}

export function TableKeyboardNavigationScope({
    children,
    enabled = true,
    containerRef,
    inherit = false,
}: {
    children: React.ReactNode;
    enabled?: boolean;
    containerRef?: React.RefObject<HTMLElement>;
    inherit?: boolean;
}) {
    const parent = React.useContext(ScopeContext);
    const own = React.useMemo<Scope>(
        () => ({
            enabled: enabled && parent?.enabled !== false,
            containerRef,
            searches: new Set(),
            adapters: new Set(),
            listeners: new Set(),
        }),
        [enabled, parent, containerRef],
    );
    const scope = inherit && enabled && parent ? parent : own;
    React.useEffect(() => {
        if (scope !== own) {
            return undefined;
        }
        const onKeyDown = (event: KeyboardEvent) => handleKeyDown(scope, event);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [scope, own, parent]);
    return <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>;
}

export function useTableNavigationEnabled() {
    const scope = React.useContext(ScopeContext);
    const subscribe = React.useCallback(
        (listener: () => void) => {
            scope?.listeners.add(listener);
            return () => {
                scope?.listeners.delete(listener);
            };
        },
        [scope],
    );
    const getSnapshot = React.useCallback(
        () => Boolean(scope?.enabled && scope.searches.size),
        [scope],
    );
    return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function useTableSearch(
    ref: React.RefObject<HTMLInputElement>,
    enabled: boolean,
    value?: string,
) {
    const scope = React.useContext(ScopeContext);
    React.useEffect(() => {
        const input = ref.current;
        if (!scope || !scope.enabled || !enabled || !input) {
            return undefined;
        }
        scope.searches.add(input);
        input.dataset.tableKeyboardSearch = '';
        notifyScope(scope);
        return () => {
            scope.searches.delete(input);
            delete input.dataset.tableKeyboardSearch;
            resetScope(scope);
            notifyScope(scope);
        };
    }, [scope, ref, enabled]);
    React.useEffect(() => {
        if (enabled && scope) {
            resetScope(scope);
        }
    }, [scope, enabled, value]);
}

interface AdapterOptions {
    tableRef: React.RefObject<HTMLElement>;
    getFirst: Adapter['getFirst'];
    getLast: Adapter['getLast'];
    getNext: Adapter['getNext'];
    activate?: Adapter['activate'];
    resetDeps: React.DependencyList;
    isValidIndex?: (index: number) => boolean;
    getRowKey?: (index: number) => string | number | undefined;
    findRowIndex?: (key: string | number, previousIndex: number) => number | undefined;
    subscribe?: (listener: () => void) => () => void;
}

type RowSelection = {index: number; key?: string | number};
type Selection = RowSelection | undefined;
const subscribeToNothing = () => () => {};

// Only this boundary rerenders on selection; table controls and data stay outside it.
export function useTableKeyboardAdapter(options: AdapterOptions) {
    const scope = React.useContext(ScopeContext);
    const [scrollRevision, setScrollRevision] = React.useState(0);
    const [hover, setHover] = React.useState(false);
    const selectedRef = React.useRef<Selection>();
    const snapshotRef = React.useRef<Selection>();
    const optionsRef = React.useRef(options);
    const [element, setElement] = React.useState<HTMLElement | null>(null);
    const ref = React.useCallback(
        (node: HTMLElement | null) => {
            (options.tableRef as React.MutableRefObject<HTMLElement | null>).current = node;
            setElement(node);
        },
        [options.tableRef],
    );
    optionsRef.current = options;
    const getSelection = React.useCallback((): Selection => {
        const current = selectedRef.current;
        let next = current;
        if (current) {
            const {findRowIndex, getRowKey, isValidIndex, getLast} = optionsRef.current;
            const matchedIndex =
                current.key !== undefined && findRowIndex
                    ? findRowIndex(current.key, current.index)
                    : current.index;
            // Keep the visual position when the entity disappears, clamping to the last row.
            const position = matchedIndex ?? current.index;
            const index = isValidIndex?.(position) === false ? getLast() : position;
            next = index === undefined ? undefined : {index, key: getRowKey?.(index)};
        }
        const previous = snapshotRef.current;
        if (previous && next && previous.index === next.index && previous.key === next.key) {
            return previous;
        }
        snapshotRef.current = next;
        return next;
    }, []);
    const selection = React.useSyncExternalStore(
        options.subscribe ?? subscribeToNothing,
        getSelection,
        getSelection,
    );
    React.useLayoutEffect(() => {
        selectedRef.current = selection;
    }, [selection]);
    const select = React.useCallback((index: number | undefined) => {
        const next =
            index === undefined ? undefined : {index, key: optionsRef.current.getRowKey?.(index)};
        const previous = selectedRef.current;
        selectedRef.current = next;
        if (previous?.index !== next?.index || previous?.key !== next?.key) {
            setScrollRevision((revision) => revision + 1);
        }
        setHover(false);
    }, []);
    const getSelected = React.useCallback(() => getSelection()?.index, [getSelection]);
    const previousResetDeps = React.useRef(options.resetDeps);
    React.useLayoutEffect(() => {
        const previous = previousResetDeps.current;
        previousResetDeps.current = options.resetDeps;
        if (
            previous.length !== options.resetDeps.length ||
            options.resetDeps.some((value, index) => !Object.is(value, previous[index]))
        ) {
            select(undefined);
        }
    }, [options.resetDeps, select]);
    React.useEffect(() => {
        if (!scope || !element) {
            return undefined;
        }
        const adapter: Adapter = {
            element,
            scope,
            getFirst: () => optionsRef.current.getFirst(),
            getLast: () => optionsRef.current.getLast(),
            getNext: (index, step) => optionsRef.current.getNext(index, step),
            getSelected,
            select,
            get activate() {
                return optionsRef.current.activate;
            },
        };
        scope.adapters.add(adapter);
        return () => {
            scope.adapters.delete(adapter);
            if (scope.activeAdapter === adapter) {
                scope.activeAdapter = undefined;
            }
        };
    }, [scope, element, select, getSelected]);
    return {
        ref,
        scrollRevision,
        selected: selection?.index,
        focusedIndex: hover ? undefined : selection?.index,
        onMouseMove: (event: React.MouseEvent<HTMLElement>) => {
            if (selectedRef.current && (event.target as HTMLElement).closest('tbody tr')) {
                setHover(true);
            }
        },
    };
}
