import type {ETabletState, EType} from '../api/tablet';

export interface TabletsState {
    stateFilter: ETabletState[];
    typeFilter: EType[];
}

export interface TabletsApiRequestParams {
    nodeId?: string | number;
    path?: string;
    database?: string;
}

export interface TabletsRootStateSlice {
    tablets: TabletsState;
}
