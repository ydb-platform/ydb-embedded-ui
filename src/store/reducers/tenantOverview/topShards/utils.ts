import {generateEvaluator} from '../../../../utils/generateEvaluator';

export const getLoadSeverityForShard = generateEvaluator(60, 80, ['success', 'warning', 'danger']);
