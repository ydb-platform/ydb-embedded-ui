import block from 'bem-cn-lite';

import {ReadLagImage, WriteLagImage} from '../LagImages';

import './LagPopoverContent.scss';

const b = block('ydb-lag-popover-content');

interface LagPopoverContentProps {
    text: string;
    type: 'read' | 'write';
}

export const LagPopoverContent = ({text, type}: LagPopoverContentProps) => (
    <div className={b({type})}>
        <div className={b('text')}>{text}</div>
        <div>{type === 'read' ? <ReadLagImage /> : <WriteLagImage />}</div>
    </div>
);
