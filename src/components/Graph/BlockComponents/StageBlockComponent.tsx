import type {TBlock} from '@gravity-ui/graph';

type Props = {
    block: TBlock;
    className: string;
};

export const StageBlockComponent = ({className, block}: Props) => {
    return (
        <div className={className}>
            {block.operators ? block.operators.join('') : block.name} #{block.id}
        </div>
    );
};
