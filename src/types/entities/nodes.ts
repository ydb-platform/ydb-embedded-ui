import type {StorageProblemType} from './storage';

export type NodeType = 'static' | 'dynamic' | 'any';

export interface NodesApiRequestParams {
    tenant?: string;
    type?: NodeType;
    problemFilter?: StorageProblemType;
    storage?: boolean;
    tablets?: boolean;
}
