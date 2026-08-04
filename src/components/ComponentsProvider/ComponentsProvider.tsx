import React from 'react';

import type {ComponentsRegistry} from './componentsRegistry';

const componentsStoreContext = React.createContext<ComponentsRegistry | undefined>(undefined);

interface ComponentsProviderProps {
    registry: ComponentsRegistry;
    children: React.ReactNode;
}
export function ComponentsProvider({children, registry}: ComponentsProviderProps) {
    return (
        <componentsStoreContext.Provider value={registry}>
            {children}
        </componentsStoreContext.Provider>
    );
}

export function useComponent<T extends Parameters<ComponentsRegistry['get']>[0]>(id: T) {
    const store = React.useContext(componentsStoreContext);
    if (store === undefined) {
        throw new Error('useComponent must be used within ComponentsProvider');
    }
    return store.get(id);
}

export function useHasComponent<T extends Parameters<ComponentsRegistry['has']>[0]>(id: T) {
    const store = React.useContext(componentsStoreContext);
    if (store === undefined) {
        throw new Error('useHasComponent must be used within ComponentsProvider');
    }
    return store.has(id);
}
