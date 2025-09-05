import React from 'react';

import type {EPathSubType, EPathType} from '../../types/api/schema';

export interface TenantContextType {
    path: string;
    database: string;
    databaseFullPath: string;
    type?: EPathType;
    subType?: EPathSubType;
}

const SchemaContext = React.createContext<TenantContextType | undefined>(undefined);

interface TenantContextProviderProps {
    children: React.ReactNode;
    path: string;
    database: string;
    databaseFullPath: string;
    type?: EPathType;
    subType?: EPathSubType;
}

export const TenantContextProvider = ({
    children,
    path,
    database,
    type,
    subType,
    databaseFullPath,
}: TenantContextProviderProps) => {
    const value = React.useMemo(
        () => ({
            path,
            database,
            type,
            subType,
            databaseFullPath,
        }),
        [path, database, type, subType, databaseFullPath],
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
