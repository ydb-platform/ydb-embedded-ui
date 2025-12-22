import React from 'react';

import type {PaginatedTableState} from './types';

// Default state for the table
const defaultTableState: PaginatedTableState = {
    sortParams: undefined,
    totalEntities: 0,
    foundEntities: 0,
    isInitialLoad: true,
};

// Context type definition
interface PaginatedTableStateContextType {
    // State
    tableState: PaginatedTableState;
    noBatching?: boolean;

    // Granular setters
    setSortParams: (params: PaginatedTableState['sortParams']) => void;
    setTotalEntities: (total: number) => void;
    setFoundEntities: (found: number) => void;
    setIsInitialLoad: (isInitial: boolean) => void;
}

// Creating the context with default values
export const PaginatedTableStateContext = React.createContext<PaginatedTableStateContextType>({
    tableState: defaultTableState,
    setSortParams: () => undefined,
    setTotalEntities: () => undefined,
    setFoundEntities: () => undefined,
    setIsInitialLoad: () => undefined,
});

// Provider component props
interface PaginatedTableStateProviderProps {
    children: React.ReactNode;
    initialState?: Partial<PaginatedTableState>;
    noBatching?: boolean;
}

// Provider component
export const PaginatedTableProvider = ({
    children,
    initialState = {},
    noBatching,
}: PaginatedTableStateProviderProps) => {
    // Use individual state variables for each field
    const [sortParams, setSortParams] = React.useState<PaginatedTableState['sortParams']>(
        initialState.sortParams ?? defaultTableState.sortParams,
    );
    const [totalEntities, setTotalEntities] = React.useState<number>(
        initialState.totalEntities ?? defaultTableState.totalEntities,
    );
    const [foundEntities, setFoundEntities] = React.useState<number>(
        initialState.foundEntities ?? defaultTableState.foundEntities,
    );
    const [isInitialLoad, setIsInitialLoad] = React.useState<boolean>(
        initialState.isInitialLoad ?? defaultTableState.isInitialLoad,
    );

    // Construct tableState from individual state variables
    const tableState = React.useMemo(
        () => ({
            sortParams,
            totalEntities,
            foundEntities,
            isInitialLoad,
        }),
        [sortParams, totalEntities, foundEntities, isInitialLoad],
    );

    // Create the context value with the constructed tableState and direct setters
    const contextValue = React.useMemo(
        () => ({
            tableState,
            noBatching,
            setSortParams,
            setTotalEntities,
            setFoundEntities,
            setIsInitialLoad,
        }),
        [tableState, noBatching],
    );

    return (
        <PaginatedTableStateContext.Provider value={contextValue}>
            {children}
        </PaginatedTableStateContext.Provider>
    );
};

// Custom hook for consuming the context
export const usePaginatedTableState = () => {
    const context = React.useContext(PaginatedTableStateContext);

    if (context === undefined) {
        throw new Error('usePaginatedTableState must be used within a PaginatedTableStateProvider');
    }

    return context;
};
