import React from 'react';

const isFrozenContext = React.createContext<boolean>(false);

interface IsFrozenProviderProps {
    isFrozen: boolean;
    children: React.ReactNode;
}

export function IsFrozenProvider({children, isFrozen}: IsFrozenProviderProps) {
    return <isFrozenContext.Provider value={isFrozen}>{children}</isFrozenContext.Provider>;
}

export function useIsFrozenContext() {
    const isFrozen = React.useContext(isFrozenContext);
    return isFrozen;
}
