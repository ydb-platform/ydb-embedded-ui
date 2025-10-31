import React from 'react';

interface AppTitleContextType {
    appTitle: string;
}

const AppTitleContext = React.createContext<AppTitleContextType | undefined>(undefined);

interface AppTitleProviderProps {
    appTitle: string;
    children: React.ReactNode;
}

export function AppTitleProvider({appTitle, children}: AppTitleProviderProps) {
    return <AppTitleContext.Provider value={{appTitle}}>{children}</AppTitleContext.Provider>;
}

export function useAppTitle(): AppTitleContextType {
    const context = React.useContext(AppTitleContext);
    if (context === undefined) {
        throw new Error('useAppTitle must be used within an AppTitleProvider');
    }
    return context;
}
