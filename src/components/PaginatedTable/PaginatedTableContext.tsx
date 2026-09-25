import React from 'react';

import type {TableCountsAction} from './tableCounts';
import {tableCountsReducer} from './tableCounts';
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
    dispatchCounts: React.Dispatch<TableCountsAction>;
}

// Creating the context with default values
export const PaginatedTableStateContext = React.createContext<PaginatedTableStateContextType>({
    tableState: defaultTableState,
    setSortParams: () => undefined,
    dispatchCounts: () => undefined,
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
    const [sortParams, setSortParams] = React.useState<PaginatedTableState['sortParams']>(
        initialState.sortParams ?? defaultTableState.sortParams,
    );
    const [{totalEntities, foundEntities, isInitialLoad}, dispatchCounts] = React.useReducer(
        tableCountsReducer,
        {
            totalEntities: initialState.totalEntities ?? defaultTableState.totalEntities,
            foundEntities: initialState.foundEntities ?? defaultTableState.foundEntities,
            isInitialLoad: initialState.isInitialLoad ?? defaultTableState.isInitialLoad,
            hasLoadedData: initialState.isInitialLoad === false,
        },
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

    // Create the context value with the constructed tableState and its update functions
    const contextValue = React.useMemo(
        () => ({
            tableState,
            noBatching,
            setSortParams,
            dispatchCounts,
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
