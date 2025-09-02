import type { TBlock } from '@gravity-ui/graph';
import { Text } from '@gravity-ui/uikit';

import { TooltipComponent } from '../TooltipComponent';

type Props = {
    block: TBlock;
    className: string;
};

export const StageBlockComponent = ({ className, block }: Props) => {
    const content = <div className={className}>
        {block.operators ? block.operators.map((item) => <div key={item}>{item}</div>) : block.name}
        {block.tables ? <div><Text color='secondary'>Tables: </Text>{block.tables.join(', ')}</div> : null}
    </div>;

    if (!block.stats?.length) {
        return content;
    }

    return (
        <TooltipComponent block={block}>{content}</TooltipComponent>
            
    );
};
