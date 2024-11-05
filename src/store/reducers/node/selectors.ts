import {createSelector} from '@reduxjs/toolkit';

import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import {prepareWhiteboardVDiskData} from '../../../utils/disks/prepareDisks';
import type {RootState} from '../../defaultStore';

import {nodeApi} from './node';
import type {PreparedNodeStructure, PreparedStructureVDisk, RawNodeStructure} from './types';

const getNodeStructureSelector = createSelector(
    (nodeId: string) => nodeId,
    (nodeId) => nodeApi.endpoints.getNodeStructure.select({nodeId}),
);

const selectGetNodeStructureData = createSelector(
    (state: RootState) => state,
    (_state: RootState, nodeId: string) => getNodeStructureSelector(nodeId),
    (state, selectGetNodeStructure) => selectGetNodeStructure(state).data,
);

export const selectNodeStructure = createSelector(
    (_state: RootState, nodeId: string) => Number(nodeId),
    (state: RootState, nodeId: string) => selectGetNodeStructureData(state, nodeId),
    (nodeId, storageInfo) => {
        const pools = storageInfo?.StoragePools;
        const structure: RawNodeStructure = {};

        pools?.forEach((pool) => {
            const groups = pool.Groups;
            groups?.forEach((group) => {
                const vDisks = group.VDisks?.filter((el) => el.NodeId === nodeId).map(
                    prepareWhiteboardVDiskData,
                );
                vDisks?.forEach((vd) => {
                    const vDiskId = stringifyVdiskId(vd.VDiskId);
                    const pDiskId = vd.PDisk?.PDiskId;
                    if (!structure[String(pDiskId)]) {
                        structure[String(pDiskId)] = {vDisks: {}, ...vd.PDisk};
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

        const structureWithVDisksArray = Object.keys(structure).reduce<PreparedNodeStructure>(
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
        return structureWithVDisksArray;
    },
);
