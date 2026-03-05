import type {LabelProps} from '@gravity-ui/uikit';
import {Label} from '@gravity-ui/uikit';

import type {QueryExecutionStatusType, StreamingStatus} from '../../store/reducers/query/types';

import {getQueryExecutionLabelAppearance} from './getQueryExecutionLabelAppearance';

interface QueryExecutionLabelProps {
    status: QueryExecutionStatusType;
    streamingStatus?: StreamingStatus;
    className?: string;
    value?: string;
    size?: LabelProps['size'];
    iconSize?: number;
}

export const QueryExecutionLabel = ({
    status,
    streamingStatus,
    className,
    value,
    size = 'm',
    iconSize = 16,
}: QueryExecutionLabelProps) => {
    const {icon, label, theme} = getQueryExecutionLabelAppearance(status, streamingStatus, {
        iconSize,
    });

    return (
        <Label theme={theme} size={size} className={className} icon={icon} value={value}>
            {label}
        </Label>
    );
};
