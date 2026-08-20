import {Text} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';
import {TooltipComponent} from '../TooltipComponent';
import i18n from '../i18n';
import type {ExtendedTBlock} from '../types';

const b = cn('ydb-gravity-graph');

type Props = {
    block: ExtendedTBlock;
    className: string;
};

export const StageBlockComponent = ({className, block}: Props) => {
    const content = (
        <div className={className}>
            {block.operators?.length
                ? block.operators.map((item) => <div key={item}>{item}</div>)
                : block.name}
            {block.tables?.map((table, index) => (
                <div key={`${table}-${index}`} className={b('stage-table-row')} title={table}>
                    {index === 0 ? <Text color="secondary">{i18n('label_tables')}: </Text> : null}
                    {table}
                </div>
            ))}
        </div>
    );

    if (!block.stats?.length) {
        return content;
    }

    return <TooltipComponent block={block}>{content}</TooltipComponent>;
};
