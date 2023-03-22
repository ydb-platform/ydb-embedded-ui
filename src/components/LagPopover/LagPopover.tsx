import block from 'bem-cn-lite';

import {ReadLagImage, WriteLagImage} from '../LagImages';

import './LagPopover.scss';

const b = block('ydb-lag-popover');

interface LagPopoverProps {
    text: string;
    type: 'read' | 'write';
}

export const LagPopover = ({text, type}: LagPopoverProps) => (
    <div className={b({type})}>
        <div>{text}</div>
        <div>{type === 'read' ? <ReadLagImage /> : <WriteLagImage />}</div>
    </div>
);
