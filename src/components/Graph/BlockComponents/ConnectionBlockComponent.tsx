import type {TBlock} from '@gravity-ui/graph';
import { Icon } from '@gravity-ui/uikit';
import {DatabaseFill, Shuffle, GripHorizontal, MapPin, ArrowsExpandHorizontal} from '@gravity-ui/icons';

import { TooltipComponent } from '../TooltipComponent';

type Props = {
    block: TBlock;
    className: string;
};

const getIcon = (name: string) => {
    switch (name) {
        case 'Merge':
            return DatabaseFill;
        case 'UnionAll':
            return GripHorizontal;
        case 'HashShuffle':
            return Shuffle;
        case 'Map':
            return MapPin;
        case 'Broadcast':
            return ArrowsExpandHorizontal;
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
