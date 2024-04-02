import type {TCdcStreamDescription} from '../../../types/api/schema';
import {createInfoFormatter} from '../utils';

export const formatCdcStreamItem = createInfoFormatter<TCdcStreamDescription>({
    values: {
        Mode: (value) => value?.substring('ECdcStreamMode'.length),
        Format: (value) => value?.substring('ECdcStreamFormat'.length),
        PathId: (value) => JSON.stringify(value),
    },
});
