import type {GetNodeRefFunc} from '../../types/additionalProps';

export interface GetNodesColumnsParams {
    getNodeRef?: GetNodeRefFunc;
    database?: string;
}
