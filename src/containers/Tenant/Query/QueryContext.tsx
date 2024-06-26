import React from 'react';

import {SAVED_QUERIES_KEY, useSetting} from '../../../lib';
import type {SavedQuery} from '../../../types/store/query';
import {parseJson} from '../../../utils/utils';

type QueryAction = 'save' | 'idle';

const SavedQueriesContext = React.createContext<SavedQuery[] | undefined>(undefined);
const QueryActionContext = React.createContext<QueryAction | undefined>(undefined);
const QueryActionSetContext = React.createContext<((value: QueryAction) => void) | undefined>(
    undefined,
);
const SavedQueriesSetContext = React.createContext<((value: SavedQuery[]) => void) | undefined>(
    undefined,
);

export function QueryActionsProvider({children}: {children?: React.ReactNode}) {
    const [savedQueries, setSavedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY, []);
    const [queryAction, setQueryAction] = React.useState<QueryAction>('idle');

    React.useEffect(() => {
        const storageEventHandler = (event: StorageEvent) => {
            if (event.key === SAVED_QUERIES_KEY) {
                const v = parseJson(event.newValue);
                setSavedQueries(v);
            }
        };

        window.addEventListener('storage', storageEventHandler);
        return () => {
            window.removeEventListener('storage', storageEventHandler);
        };
    }, [setSavedQueries]);

    return (
        <QueryActionSetContext.Provider value={setQueryAction}>
            <QueryActionContext.Provider value={queryAction}>
                <SavedQueriesSetContext.Provider value={setSavedQueries}>
                    <SavedQueriesContext.Provider value={savedQueries}>
                        {children}
                    </SavedQueriesContext.Provider>
                </SavedQueriesSetContext.Provider>
            </QueryActionContext.Provider>
        </QueryActionSetContext.Provider>
    );
}

export function useSavedQueries() {
    const savedQueries = React.useContext(SavedQueriesContext);

    if (savedQueries === undefined) {
        throw new Error('useSaveQuery should be used within QueryActionsProvider.');
    }

    return savedQueries;
}
export function useQueryAction() {
    const queryAction = React.useContext(QueryActionContext);

    if (queryAction === undefined) {
        throw new Error('useQueryAction should be used within QueryActionsProvider.');
    }

    return queryAction;
}
export function useSetQueryAction() {
    const setQueryAction = React.useContext(QueryActionSetContext);

    if (setQueryAction === undefined) {
        throw new Error('useSetQueryAction should be used within QueryActionsProvider.');
    }

    return setQueryAction;
}
export function useSaveQuery() {
    const savedQueries = React.useContext(SavedQueriesContext);
    const setSavedQueries = React.useContext(SavedQueriesSetContext);

    if (savedQueries === undefined || setSavedQueries === undefined) {
        throw new Error('useSaveQuery should be used within QueryActionsProvider.');
    }

    const handleSaveQuery = React.useCallback(
        (queryName: string | null, queryBody = '') => {
            if (queryName === null) {
                return;
            }
            const nextSavedQueries = [...savedQueries];

            const query = nextSavedQueries.find(
                (el) => el.name.toLowerCase() === queryName.toLowerCase(),
            );

            if (query) {
                query.body = queryBody;
            } else {
                nextSavedQueries.push({name: queryName, body: queryBody});
            }

            setSavedQueries(nextSavedQueries);
        },
        [savedQueries, setSavedQueries],
    );

    return handleSaveQuery;
}

export function useDeleteQuery() {
    const savedQueries = React.useContext(SavedQueriesContext);
    const setSavedQueries = React.useContext(SavedQueriesSetContext);

    if (savedQueries === undefined || setSavedQueries === undefined) {
        throw new Error('useDeleteQuery should be used within QueryActionsProvider.');
    }

    const handleDeleteQuery = React.useCallback(
        (queryName: string) => {
            const newSavedQueries = savedQueries.filter(
                (el) => el.name.toLowerCase() !== queryName.toLowerCase(),
            );
            setSavedQueries(newSavedQueries);
        },
        [savedQueries, setSavedQueries],
    );

    return handleDeleteQuery;
}
