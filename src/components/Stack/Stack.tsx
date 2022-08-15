import React from 'react';
import cn from 'bem-cn-lite';

import './Stack.scss';

interface StackProps {
    className?: string;
}

const LAYER_CSS_VAR = '--ydb-stack-level';

const b = cn('stack');

export const Stack: React.FC<StackProps> = ({children, className}) => (
    <div className={b(null, className)}>
        {
            React.Children.map(children, (child, index) => {
                if (!React.isValidElement(child)) {
                    return null;
                }

                return (
                    <div
                        className={b('layer')}
                        style={{
                            [LAYER_CSS_VAR]: index,
                        } as React.CSSProperties}
                    >
                        {child}
                    </div>
                );
            })
        }
    </div>
);
