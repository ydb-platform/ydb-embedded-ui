import type {EPathSubType, EPathType} from '../../../../types/api/schema';

export interface PreviewContainerProps {
    database: string;
    databaseFullPath: string;
    path: string;
    type?: EPathType;
    subType?: EPathSubType;
}
