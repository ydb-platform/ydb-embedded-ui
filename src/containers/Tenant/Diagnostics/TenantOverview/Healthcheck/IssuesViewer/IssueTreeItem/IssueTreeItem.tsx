import cn from 'bem-cn-lite';

import type {EFlag} from '../../../../../../../types/api/enums';
import {EntityStatus} from '../../../../../../../components/EntityStatus/EntityStatus';

import './IssueTreeItem.scss';

const b = cn('issue-tree-item');

interface IssueRowProps {
    status: EFlag;
    message: string;
    type: string;
    onClick?: VoidFunction;
}

export const IssueTreeItem = ({status, message, type, onClick}: IssueRowProps) => {
    return (
        <div className={b()} onClick={onClick}>
            <div className={b('field', {status: true})}>
                <EntityStatus mode="icons" status={status} name={type} />
            </div>
            <div className={b('field', {message: true})}>{message}</div>
        </div>
    );
};
