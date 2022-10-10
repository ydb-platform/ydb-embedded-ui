import * as React from 'react';
import cn from 'bem-cn-lite';

import {Link} from '@gravity-ui/uikit';

import i18n from './i18n';
import './ShortyString.scss';

const block = cn('kv-shorty-string');

type Props = {
    value?: string;
    limit?: number;
    /** in strict mode the text always trims at the limit, otherwise it is allowed to overflow a little */
    strict?: boolean;
    displayLength?: boolean;
    render?: (value: string) => React.ReactNode;
    onToggle?: () => void;
    expandLabel?: string;
    collapseLabel?: string;
};

export default function ShortyString({
    value = '',
    limit = 200,
    strict = false,
    displayLength = true,
    render = (v: string) => v,
    onToggle,
    expandLabel = i18n('default_expand_label'),
    collapseLabel = i18n('default_collapse_label'),
}: Props) {
    const [expanded, setExpanded] = React.useState(false);

    const toggleLabelAction = expanded ? collapseLabel : expandLabel;
    const toggleLabelSymbolsCount = displayLength && !expanded
        ? i18n('chars_count', {count: value.length})
        : '';
    const toggleLabel = toggleLabelAction + toggleLabelSymbolsCount;

    // showing toogle button with a label that is longer than the hidden part is pointless,
    // hence compare to limit + length in the not-strict mode
    const hasToggle = value.length > limit + (strict ? 0 : toggleLabel.length);

    const text = expanded || !hasToggle
        ? value
        : value.slice(0, limit - 4) + '\u00a0...';

    return (
        <div className={block()}>
            {render(text)}
            {hasToggle ? (
                <Link
                    className={block('toggle')}
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((v) => !v);
                        onToggle?.();
                    }}
                >
                    {toggleLabel}
                </Link>
            ) : null}
        </div>
    );
}
