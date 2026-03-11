import type {ValueOf} from '../../../../types/common';

export const RESULT_OPTIONS_IDS = {
    result: 'result',
    schema: 'schema',
    simplified: 'simplified',
    json: 'json',
    stats: 'stats',
    ast: 'ast',
} as const;

export type SectionID = ValueOf<typeof RESULT_OPTIONS_IDS>;
