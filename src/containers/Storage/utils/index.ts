import type {TVDiskStateInfo, TVSlotId} from '../../../types/api/storage';
import type {IStoragePoolGroup} from '../../../types/store/storage';

export * from './constants';

export const isFullDonorData = (donor: TVDiskStateInfo | TVSlotId): donor is TVDiskStateInfo =>
    'VDiskId' in donor;

const generateEvaluator = <
    OkLevel extends string,
    WarnLevel extends string,
    CritLevel extends string
>(warn: number, crit: number, levels: [OkLevel, WarnLevel, CritLevel]) =>
    (value: number) => {
        if (0 <= value && value < warn) {
            return levels[0];
        }

        if (warn <= value && value < crit) {
            return levels[1];
        }

        if (crit <= value) {
            return levels[2];
        }

        return undefined;
    };

const defaultDegradationEvaluator = generateEvaluator(1, 2, ['success', 'warning', 'danger']);

const degradationEvaluators = {
    'block-4-2': generateEvaluator(1, 2, ['success', 'warning', 'danger']),
    'mirror-3-dc': generateEvaluator(1, 3, ['success', 'warning', 'danger']),
};

const canEvaluateErasureSpecies = (value?: string): value is keyof typeof degradationEvaluators =>
    value !== undefined && value in degradationEvaluators;

export const getDegradedSeverity = (group: IStoragePoolGroup) => {
    const evaluate = canEvaluateErasureSpecies(group.ErasureSpecies) ?
        degradationEvaluators[group.ErasureSpecies] :
        defaultDegradationEvaluator;

    return evaluate(group.Missing);
};

export const getUsageSeverity = generateEvaluator(80, 85, ['success', 'warning', 'danger']);

export const getUsage = (data: IStoragePoolGroup, step = 1) => {
    // if limit is 0, display 0
    const usage = Math.round((data.Used * 100) / data.Limit) || 0;

    return Math.floor(usage / step) * step;
};
