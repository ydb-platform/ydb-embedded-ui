import type {IProtobufTimeObject} from './common';

export interface ControlPlaneOperation {
    id?: string;
    description?: string;
    done?: boolean;
    created_by?: string;
    created_at?: string | IProtobufTimeObject;
    modified_at?: string | IProtobufTimeObject;
    error?: {code?: number; message?: string};
}

export interface ControlPlaneOperationList {
    operations?: ControlPlaneOperation[];
    next_page_token?: string;
}

export interface ControlPlaneOperationListParams {
    clusterName: string;
    folderId: string;
    databaseId: string;
    pageSize?: number;
    pageToken?: string;
}
