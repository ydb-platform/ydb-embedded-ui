import {generateEvaluator} from '../../../../utils/generateEvaluator';

export const getLoadSeverityForNode = generateEvaluator(60, 80, ['success', 'warning', 'danger']);
