import React from 'react';

export interface TenantContextType {
    path: string;
    database: string;
    databaseFullPath: string;
}

const SchemaContext = React.createContext<TenantContextType | undefined>(undefined);

interface TenantContextProviderProps {
    children: React.ReactNode;
    path: string;
    database: string;
    databaseFullPath: string;
}

export const TenantContextProvider = ({
    children,
    path,
    database,
    databaseFullPath,
}: TenantContextProviderProps) => {
    const value = React.useMemo(
        () => ({
            path,
            database,
            databaseFullPath,
        }),
        [path, database, databaseFullPath],
    );

    return <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>;
};

export const useCurrentSchema = () => {
    const context = React.useContext(SchemaContext);

    if (context === undefined) {
        throw Error('useCurrentSchema must be used within a TenantContextProvider');
    }

    return context;
};
