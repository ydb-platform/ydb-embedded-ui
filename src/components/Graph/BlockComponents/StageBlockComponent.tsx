import {Text} from '@gravity-ui/uikit';

import {TooltipComponent} from '../TooltipComponent';
import i18n from '../i18n';
import type {ExtendedTBlock} from '../types';

type Props = {
    block: ExtendedTBlock;
    className: string;
};

export const StageBlockComponent = ({className, block}: Props) => {
    const content = (
        <div className={className}>
            {block.operators
                ? block.operators.map((item) => <div key={item}>{item}</div>)
                : block.name}
            {block.tables ? (
                <div style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    <Text color="secondary">{i18n('label_tables')}: </Text>
                    {block.tables.join(', ')}
                </div>
            ) : null}
        </div>
    );

    if (!block.stats?.length) {
        return content;
    }

    return <TooltipComponent block={block}>{content}</TooltipComponent>;
};
