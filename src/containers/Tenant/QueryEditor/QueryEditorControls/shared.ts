import block from 'bem-cn-lite';

import {QueryModes} from '../../../../types/store/query';

export const b = block('ydb-query-editor-controls');

export const QueryModeSelectorTitles = {
    [QueryModes.script]: 'Script',
    [QueryModes.scan]: 'Scan',
} as const;

export interface QueryEditorControlsProps {
    onRunButtonClick: (mode?: QueryModes) => void;
    runIsLoading: boolean;
    onExplainButtonClick: (mode?: QueryModes) => void;
    explainIsLoading: boolean;
    onSaveQueryClick: (queryName: string) => void;
    savedQueries: unknown;
    disabled: boolean;
    onUpdateQueryMode: (mode: QueryModes) => void;
    queryMode: QueryModes;
    enableQueryModesForExplain: boolean;
}
