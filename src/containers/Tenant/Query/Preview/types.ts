import type {EPathSubType, EPathType} from '../../../../types/api/schema';
import type {DocumentTableContext} from '../../../../uiFactory/types';

export interface PreviewDescriptionState {
    loading: boolean;
    error?: unknown;
}

export interface DocumentPreviewProps extends PreviewDescriptionState {
    path: string;
    context?: DocumentTableContext;
}

export interface PreviewContainerProps {
    database: string;
    databaseFullPath: string;
    path: string;
    type?: EPathType;
    subType?: EPathSubType;
}
