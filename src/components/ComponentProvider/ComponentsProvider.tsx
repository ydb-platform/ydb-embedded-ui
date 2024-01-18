import React from 'react';
import {YdbComponentsRegistry} from './ydbComponentsRegistry';

const componentsStoreContext = React.createContext<YdbComponentsRegistry | undefined>(undefined);

interface ComponentsProviderProps {
    registry: YdbComponentsRegistry;
    children: React.ReactNode;
}
export function ComponentsProvider({children, registry}: ComponentsProviderProps) {
    return (
        <componentsStoreContext.Provider value={registry}>
            {children}
        </componentsStoreContext.Provider>
    );
}

export function useComponent<T extends Parameters<YdbComponentsRegistry['get']>[0]>(id: T) {
    const store = React.useContext(componentsStoreContext);
    if (store === undefined) {
        throw new Error('useComponent must be used within ComponentsProvider');
    }
    return store.get(id);
}
