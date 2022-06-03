import * as React from 'react';
import cn from 'bem-cn-lite';

import {Link} from '@yandex-cloud/uikit';

import './ShortyString.scss';

const block = cn('kv-shorty-string');

type Props = {
    value?: string;
    limit?: number;
    displayLength?: boolean;
    render?: (value: string) => React.ReactNode;
    onToggle?: () => void;
    expandLabel?: string;
    collapseLabel?: string;
};

export default function ShortyString({
    value = '',
    limit = 200,
    displayLength = true,
    render = (v: string) => v,
    onToggle,
    expandLabel = 'Show more',
    collapseLabel = 'Show less',
}: Props) {
    const [expanded, setExpanded] = React.useState(false);
    const hasToggle = value.length > limit;
    const length =
        displayLength && !expanded ? `(${value.length} symbols)` : undefined;

    const text = expanded || value.length <= limit ? value : value.slice(0, limit - 4) + '\u00a0...';
    const label = expanded ? collapseLabel : expandLabel;
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
                    {label} {length}
                </Link>
            ) : null}
        </div>
    );
}
