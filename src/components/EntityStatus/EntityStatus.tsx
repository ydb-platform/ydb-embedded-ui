import {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import {EntityName} from '../EntityName/EntityName';
import type {EntityNameProps} from '../EntityName/EntityName';
import {StatusIcon} from '../StatusIcon/StatusIcon';
import type {StatusIconMode, StatusIconSize} from '../StatusIcon/StatusIcon';

const b = cn('entity-status');

interface EntityStatusProps extends Omit<EntityNameProps, 'leadingContent'> {
    status?: EFlag;
    size?: StatusIconSize;
    mode?: StatusIconMode;
}

export function EntityStatus({
    status = EFlag.Grey,
    size = 's',
    mode = 'color',
    ...entityNameProps
}: EntityStatusProps) {
    return (
        <EntityName
            {...entityNameProps}
            leadingContent={
                <StatusIcon className={b('icon')} status={status} size={size} mode={mode} />
            }
        />
    );
}
