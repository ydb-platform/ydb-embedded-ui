import type {Selector} from 'reselect';
import {createSelector} from 'reselect';

import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';

import type {
    NodeStateSlice,
    PreparedNodeStructure,
    PreparedStructureVDisk,
    RawNodeStructure,
} from './types';

const selectNodeId = (state: NodeStateSlice) => state.node?.data?.SystemStateInfo?.[0].NodeId;

const selectRawNodeStructure = (state: NodeStateSlice) => state.node?.nodeStructure;

export const selectNodeStructure: Selector<NodeStateSlice, PreparedNodeStructure> = createSelector(
    [selectNodeId, selectRawNodeStructure],
    (nodeId, storageInfo) => {
        const pools = storageInfo?.StoragePools;
        const structure: RawNodeStructure = {};

        pools?.forEach((pool) => {
            const groups = pool.Groups;
            groups?.forEach((group) => {
                const vDisks = group.VDisks?.filter((el) => el.NodeId === nodeId);
                vDisks?.forEach((vd) => {
                    const vDiskId = stringifyVdiskId(vd.VDiskId);
                    const pDiskId = vd.PDisk?.PDiskId;
                    if (!structure[String(pDiskId)]) {
                        structure[String(pDiskId)] = {vDisks: {}, ...vd.PDisk};
                    }
                    structure[String(pDiskId)].vDisks[vDiskId] = {
                        ...vd,
                        // VDisk doesn't have its own StoragePoolName when located inside StoragePool data
                        StoragePoolName: pool.Name,
                    };
                });
            });
        });

        const structureWithVdisksArray = Object.keys(structure).reduce<PreparedNodeStructure>(
            (preparedStructure, el) => {
                const vDisks = structure[el].vDisks;
                const vDisksArray = Object.keys(vDisks).reduce<PreparedStructureVDisk[]>(
                    (acc, key, index) => {
                        acc.push({...vDisks[key], id: key, order: index});
                        return acc;
                    },
                    [],
                );
                preparedStructure[el] = {...structure[el], vDisks: vDisksArray};
                return preparedStructure;
            },
            {},
        );
        return structureWithVdisksArray;
    },
);
