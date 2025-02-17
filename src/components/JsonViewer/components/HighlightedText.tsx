import React from 'react';

import type {NoStrictEntityMods} from '@bem-react/classname';

interface Props {
    className: (mods?: NoStrictEntityMods) => string;
    text: string;
    start?: number;
    length?: number;
    hasComa?: boolean;
    markBegin?: boolean;
}

export default function HighlightedText({className, text, start, length, hasComa}: Props) {
    const comma = hasComa ? <React.Fragment>,&nbsp;</React.Fragment> : null;

    if (length && typeof start === 'number' && start >= 0 && start < text.length) {
        const begin = text.substring(0, start);
        const highlighted = text.substring(start, start + length);
        const end = text.substring(start + length);

        return (
            <React.Fragment>
                {begin && <span className={className()}>{begin}</span>}
                <span className={className({highlighted: true})}>{highlighted}</span>
                {end && <span className={className()}>{end}</span>}
                {comma}
            </React.Fragment>
        );
    }

    return (
        <span className={className()}>
            {text}
            {comma}
        </span>
    );
}

interface MultiProps extends Omit<Props, 'start'> {
    starts: Array<number>;
}

export function MultiHighlightedText({className, text, starts, length, hasComa}: MultiProps) {
    if (!length || !starts.length) {
        const comma = hasComa ? <React.Fragment>,&nbsp;</React.Fragment> : null;
        return (
            <span className={className()}>
                {text}
                {comma}
            </span>
        );
    }

    const substrs = [];
    for (let i = 0, pos = 0; i < starts.length && pos < text.length; ++i) {
        const isLast = i === starts.length - 1;
        const to = starts[i] + (isLast ? text.length : length);
        const substr = text.substring(pos, to);
        if (substr) {
            substrs.push(
                <HighlightedText
                    className={className}
                    text={substr}
                    start={starts[i] - pos}
                    length={length}
                    hasComa={isLast && hasComa}
                />,
            );
        }
        pos = to;
    }
    return <React.Fragment>{substrs}</React.Fragment>;
}
