import type {TBlock} from '@gravity-ui/graph';
import { Text } from '@gravity-ui/uikit';

type Props = {
    block: TBlock;
    className: string;
};

export const StageBlockComponent = ({className, block}: Props) => {
    return (
        <div className={className}>
            {block.operators ? block.operators.map((item) => <div key={item}>{item}</div>) : block.name}
            {block.tables ? <div><Text color='secondary'>Tables: </Text>{block.tables.join(', ')}</div> : null}
        </div>
    );
};
