import React from 'react';

import {b} from './shared';
import type {TableContainerProps, TableContainerState} from './types';

import './GravityPaginatedTable.scss';

export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
    ({height, className, children, initialHeight}, ref) => {
        const [state, setState] = React.useState<TableContainerState>({
            isInitialRender: true,
            containerHeight: initialHeight || 0,
        });

        React.useEffect(() => {
            if (state.isInitialRender && !height) {
                setState((prev) => ({
                    ...prev,
                    isInitialRender: false,
                }));
            }
        }, [state.isInitialRender, height]);

        const effectiveHeight =
            state.isInitialRender && initialHeight ? state.containerHeight : height;

        return (
            <div
                ref={ref}
                className={b('table-container', className)}
                style={{
                    height: effectiveHeight,
                    overflow: 'auto',
                }}
            >
                {children}
            </div>
        );
    },
);

TableContainer.displayName = 'TableContainer';
