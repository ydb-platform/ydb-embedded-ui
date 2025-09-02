import type {TBlock} from '@gravity-ui/graph';
import { Icon } from '@gravity-ui/uikit';
import {CodeMerge, Shuffle, VectorCircle, MapPin, BroadcastSignal} from '@gravity-ui/icons';

import { TooltipComponent } from '../TooltipComponent';

type Props = {
    block: TBlock;
    className: string;
};

const getIcon = (name: string) => {
    switch (name) {
        case 'Merge':
            return CodeMerge;
        case 'UnionAll':
            return VectorCircle;
        case 'HashShuffle':
            return Shuffle;
        case 'Map':
            return MapPin;
        case 'Broadcast':
            return BroadcastSignal;
    }
}

export const ConnectionBlockComponent = ({className, block}: Props) => {
    const icon = getIcon(block.name);
    const content = (
        <div className={className}>
            {icon && <Icon data={icon}/>} {block.name}
        </div>
    );

    if (!block.stats?.length) {
        return content;
    }

    return (
        <TooltipComponent block={block}>{content}</TooltipComponent>
            
    );
};
