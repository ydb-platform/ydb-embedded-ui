import type {EPathType} from '../../../../types/api/schema';

export interface PreviewContainerProps {
    database: string;
    path: string;
    type?: EPathType;
}
