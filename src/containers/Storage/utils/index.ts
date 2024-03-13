import type {PreparedStorageGroup} from '../../../store/reducers/storage/types';
import {EFlag} from '../../../types/api/enums';
import {generateEvaluator} from '../../../utils/generateEvaluator';

const defaultDegradationEvaluator = generateEvaluator(1, 2, ['success', 'warning', 'danger']);

const degradationEvaluators = {
    'block-4-2': generateEvaluator(1, 2, ['success', 'warning', 'danger']),
    'mirror-3-dc': generateEvaluator(1, 3, ['success', 'warning', 'danger']),
};

const canEvaluateErasureSpecies = (value?: string): value is keyof typeof degradationEvaluators =>
    value !== undefined && value in degradationEvaluators;

export const getDegradedSeverity = (group: PreparedStorageGroup) => {
    const evaluate = canEvaluateErasureSpecies(group.ErasureSpecies)
        ? degradationEvaluators[group.ErasureSpecies]
        : defaultDegradationEvaluator;

    return evaluate(group.Degraded);
};

export const getUsageSeverityForStorageGroup = generateEvaluator(80, 85, [
    'success',
    'warning',
    'danger',
]);
export const getUsageSeverityForEntityStatus = generateEvaluator(80, 85, [
    EFlag.Green,
    EFlag.Yellow,
    EFlag.Red,
]);
