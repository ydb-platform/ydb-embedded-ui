import {
    ArrowsExpandHorizontal,
    DatabaseFill,
    GripHorizontal,
    MapPin,
    Shuffle,
} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';
import type {IconData} from '@gravity-ui/uikit';

import {TooltipComponent} from '../TooltipComponent';
import type {ExtendedTBlock} from '../types';

type Props = {
    block: ExtendedTBlock;
    className: string;
};

const getIcon = (name: string): IconData | undefined => {
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
        default:
            return undefined;
    }
};

export const ConnectionBlockComponent = ({className, block}: Props) => {
    const icon = getIcon(block.name);
    const content = (
        <div className={className}>
            {icon && <Icon data={icon} />} {block.name}
        </div>
    );

    if (!block.stats?.length) {
        return content;
    }

    return <TooltipComponent block={block}>{content}</TooltipComponent>;
};
