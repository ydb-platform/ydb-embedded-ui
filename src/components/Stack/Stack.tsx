import React from 'react';

import {cn} from '../../utils/cn';

import './Stack.scss';

interface StackProps {
    className?: string;
    children: React.ReactNode;
}

const LAYER_CSS_VAR = '--ydb-stack-level';

const b = cn('stack');

export const Stack = ({children, className}: StackProps) => (
    <div className={b(null, className)}>
        {React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) {
                return null;
            }

            return (
                <div
                    className={b('layer')}
                    style={
                        {
                            [LAYER_CSS_VAR]: index,
                        } as React.CSSProperties
                    }
                >
                    {child}
                </div>
            );
        })}
    </div>
);
