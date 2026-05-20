import React from 'react';

import {cn} from '../../utils/cn';

import './Stack.scss';

interface StackProps {
    className?: string;
    children: React.ReactNode;
    compact?: boolean;
    expanded?: boolean;
}

const ITEMS_COUNT_CSS_VAR = '--ydb-stack-items-count';
const LEVEL_CSS_VAR = '--ydb-stack-level';

const b = cn('ydb-stack');

export function Stack({children, className, compact, expanded}: StackProps) {
    const validChildren = React.Children.toArray(children).filter(
        (child): child is React.ReactElement => React.isValidElement(child),
    );
    const itemsCount = validChildren.length;

    return (
        <div
            className={b({compact, expanded}, className)}
            style={
                {
                    [ITEMS_COUNT_CSS_VAR]: itemsCount,
                } as React.CSSProperties
            }
        >
            <div className={b('background')} />
            {validChildren.map((child, index) => {
                const isMain = index === 0;
                const isDonor = index > 0;
                const isCollapsedHidden = isDonor && index !== itemsCount - 1;

                return (
                    <div
                        key={child.key ?? index}
                        className={b('item', {
                            main: isMain,
                            donor: isDonor,
                            'collapsed-hidden': isCollapsedHidden,
                        })}
                        style={
                            {
                                [LEVEL_CSS_VAR]: index,
                            } as React.CSSProperties
                        }
                    >
                        {child}
                    </div>
                );
            })}
        </div>
    );
}
