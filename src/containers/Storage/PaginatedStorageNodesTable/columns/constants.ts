import type {SelectOption} from '@gravity-ui/uikit';
import {z} from 'zod';

import type {NodesColumnId} from '../../../../components/nodesColumns/constants';
import {getNodesGroupByFieldTitle} from '../../../../components/nodesColumns/constants';
import type {NodesGroupByField} from '../../../../types/api/nodes';

export const STORAGE_NODES_COLUMNS_WIDTH_LS_KEY = 'storageNodesColumnsWidth';
export const STORAGE_NODES_SELECTED_COLUMNS_LS_KEY = 'storageNodesSelectedColumns';

export const DEFAULT_STORAGE_NODES_COLUMNS: NodesColumnId[] = [
    'NodeId',
    'Host',
    'Uptime',
    'CPU',
    'RAM',
    'PDisks',
];
export const REQUIRED_STORAGE_NODES_COLUMNS: NodesColumnId[] = ['NodeId'];

const STORAGE_NODES_GROUP_BY_PARAMS = [
    'Host',
    'DC',
    'Rack',
    'Version',
    'Uptime',
    'Missing',
    'DiskSpaceUsage',
    'CapacityAlert',
] as const satisfies NodesGroupByField[];

const CAPACITY_METRICS_USER_SETTINGS_COLUMNS_IDS: NodesColumnId[] = [
    'MaxPDiskUsage',
    'MaxVDiskSlotUsage',
    'CapacityAlert',
];

export function isCapacityMetricsUserNodesColumn(columnId: string): boolean {
    return CAPACITY_METRICS_USER_SETTINGS_COLUMNS_IDS.some((el) => el === columnId);
}

export const STORAGE_NODES_GROUP_BY_OPTIONS: SelectOption[] = STORAGE_NODES_GROUP_BY_PARAMS.map(
    (param) => {
        return {
            value: param,
            content: getNodesGroupByFieldTitle(param),
        };
    },
);

export const storageNodesGroupByParamSchema = z
    .custom<NodesGroupByField | undefined>((value) => STORAGE_NODES_GROUP_BY_PARAMS.includes(value))
    .catch(undefined);
