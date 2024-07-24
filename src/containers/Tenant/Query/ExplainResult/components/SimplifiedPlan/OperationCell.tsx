import React from 'react';

import {ArrowToggle, Button, Flex} from '@gravity-ui/uikit';
import type {Row} from '@tanstack/react-table';

import type {SimlifiedPlanOperatorOtherParams} from '../../../../../../types/api/query';

import {OperationParams} from './OperationParams';
import {block} from './utils';

interface OperationCellProps<TData> {
    row: Row<TData>;
    depth?: number;
    params: {name: string; operationParams?: SimlifiedPlanOperatorOtherParams};
}

function getDividers(depth: number) {
    const dividers = [];
    for (let i = 1; i <= depth; i++) {
        dividers.push(
            <div
                className={block('divider')}
                style={{
                    left: 25 * i - 16,
                }}
            ></div>,
        );
    }
    return dividers;
}

export function OperationCell<TData>({row, depth = 0, params}: OperationCellProps<TData>) {
    const {name, operationParams} = params;

    const dividers = React.useMemo(() => getDividers(depth), [depth]);

    for (let i = 1; i <= depth; i++) {
        dividers.push(
            <div
                className={block('divider')}
                style={{
                    left: 25 * i - 16,
                }}
            ></div>,
        );
    }

    return (
        <div
            style={{
                paddingLeft: 25 * depth,
            }}
            className={block('operation-name')}
        >
            {dividers}
            <Flex gap={1} alignItems="flex-start" className={block('cell-content')}>
                {row.getCanExpand() && (
                    <Button view="flat" size="xs" onClick={row.getToggleExpandedHandler()}>
                        <Button.Icon>
                            <ArrowToggle
                                direction={row.getIsExpanded() ? 'bottom' : 'right'}
                                size={14}
                            />
                        </Button.Icon>
                    </Button>
                )}
                <div>
                    {name}&nbsp;
                    <OperationParams params={operationParams} />
                </div>
            </Flex>
        </div>
    );
}
