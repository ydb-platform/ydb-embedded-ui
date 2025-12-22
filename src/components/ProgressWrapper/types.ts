import type {ProgressSize} from '@gravity-ui/uikit';

import type {FormatProgressViewerValues} from '../../utils/progress';
import type {MemorySegment} from '../MemoryViewer/utils';

export interface ProgressWrapperBaseProps {
    formatValues?: FormatProgressViewerValues;
    className?: string;
    width?: number | 'full';
    size?: ProgressSize;
    withCapacityUsage?: boolean;
}

export interface ProgressWrapperSingleProps extends ProgressWrapperBaseProps {
    value?: number | string;
    capacity?: number | string;
    stack?: never;
}

export interface ProgressWrapperStackProps extends ProgressWrapperBaseProps {
    stack: MemorySegment[];
    totalCapacity?: number | string;
    value?: never;
    capacity?: never;
}

export type ProgressWrapperProps = ProgressWrapperSingleProps | ProgressWrapperStackProps;

export interface ProgressContainerProps {
    children: React.ReactNode;
    displayText?: string;
    withCapacityUsage?: boolean;
    className?: string;
    width?: number | 'full';
}
