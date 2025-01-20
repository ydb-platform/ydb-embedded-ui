import React from 'react';

import {b} from '../shared';

interface SortIconProps {
    isSorted: boolean;
    sortDirection?: 'asc' | 'desc';
}

export function SortIcon({isSorted, sortDirection}: SortIconProps) {
    return (
        <span
            className={b('sort-icon-container', {
                shadow: !isSorted,
            })}
        >
            <svg
                className={b('sort-icon', {
                    desc: sortDirection === 'desc',
                })}
                viewBox="0 0 10 6"
                width="10"
                height="6"
            >
                <path fill="currentColor" d="M0 5h10l-5 -5z" />
            </svg>
        </span>
    );
}

SortIcon.displayName = 'SortIcon';
