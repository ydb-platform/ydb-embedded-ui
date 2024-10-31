import React from 'react';

const TreeKeyContext = React.createContext<string | undefined>(undefined);
const TreeKeyDispatchContext = React.createContext<React.Dispatch<string> | undefined>(undefined);

interface TreeKeyProviderProps {
    children: React.ReactNode;
}

export function TreeKeyProvider({children}: TreeKeyProviderProps) {
    const [key, setKey] = React.useState<string>('');

    return (
        <TreeKeyContext.Provider value={key}>
            <TreeKeyDispatchContext.Provider value={setKey}>
                {children}
            </TreeKeyDispatchContext.Provider>
        </TreeKeyContext.Provider>
    );
}

export function useTreeKey() {
    const key = React.useContext(TreeKeyContext);
    if (key === undefined) {
        throw new Error('useTreeKey must be used within a TreeKeyProvider');
    }
    return key;
}
export function useDispatchTreeKey() {
    const updateKey = React.useContext(TreeKeyDispatchContext);
    if (updateKey === undefined) {
        throw new Error('useDispatchTreeKey must be used within a TreeKeyProvider');
    }
    return updateKey;
}
