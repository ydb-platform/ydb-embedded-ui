import type {TBlock} from '@gravity-ui/graph';

type Props = {
    block: TBlock;
    className: string;
};

export const ResultBlockComponent = ({className, block}: Props) => {
    return <div className={className}>{block.name}</div>;
};
