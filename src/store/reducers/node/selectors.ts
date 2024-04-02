import type {Selector} from '@reduxjs/toolkit';
import {createSelector} from '@reduxjs/toolkit';

import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import {preparePDiskData} from '../../../utils/disks/prepareDisks';

import type {
    NodeStateSlice,
    PreparedNodeStructure,
    PreparedStructureVDisk,
    RawNodeStructure,
} from './types';

const selectNodeId = (state: NodeStateSlice) => state.node?.data?.NodeId;

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
                    const preparedPDisk = preparePDiskData(vd.PDisk);
                    const pDiskId = preparedPDisk.PDiskId;
                    if (!structure[String(pDiskId)]) {
                        structure[String(pDiskId)] = {vDisks: {}, ...preparedPDisk};
                    }
                    structure[String(pDiskId)].vDisks[vDiskId] = {
                        ...vd,
                        PDiskId: pDiskId,
                        NodeId: nodeId,
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
