import React from 'react';

import {ArrowToggle, Button, Flex} from '@gravity-ui/uikit';
import type {Row} from '@tanstack/react-table';

import type {SimlifiedPlanOperatorOtherParams} from '../../../../../../types/api/query';

import {OperationParams} from './OperationParams';
import {block} from './utils';

const LEVEL_PADDING = 25;
const FIRST_PADDING = 9;

interface OperationCellProps<TData> {
    row: Row<TData>;
    depth?: number;
    params: {name: string; operationParams?: SimlifiedPlanOperatorOtherParams; lines?: string};
}

interface DividerProps {
    modifiers?: Record<string, string | boolean>;
    left: number;
}

function Divider({modifiers, left}: DividerProps) {
    return (
        <div
            className={block('divider', modifiers)}
            style={{
                left,
            }}
        />
    );
}

function getDividers(lines: string, hasVisibleSubNodes: boolean) {
    const linesArray = lines.split('.').map(Number);
    const dividers = [];
    for (let i = 0; i < linesArray.length; i++) {
        //logic for calculating left coordinate: FIRST_PADDING - is a padding from start of a level to the middle of toggle button
        // LEVEL_PADDING is a difference between levels
        // (i-1): in `lines` we have digits that point, should we paint a line for previous levels or not
        if (i === linesArray.length - 1 && i !== 0) {
            if (linesArray[i]) {
                //horizontal pointer to the node (├)
                dividers.push(
                    <Divider
                        key={'last'}
                        modifiers={{horizontal: true}}
                        left={FIRST_PADDING + 1 + LEVEL_PADDING * (i - 1)}
                    />,
                );
            } else {
                //pointer to the last child in the branch (└)
                dividers.push(
                    <Divider
                        key={'last'}
                        modifiers={{last: true}}
                        left={FIRST_PADDING + LEVEL_PADDING * (i - 1)}
                    />,
                );
            }
        }
        if (i === linesArray.length - 1 && hasVisibleSubNodes) {
            //starting vertical line if node has leafs
            dividers.push(
                <Divider
                    key={'first'}
                    modifiers={{first: true}}
                    left={FIRST_PADDING + LEVEL_PADDING * i}
                />,
            );
        }
        if (linesArray[i]) {
            //vertical line indicating level
            dividers.push(<Divider key={i} left={FIRST_PADDING + LEVEL_PADDING * (i - 1)} />);
        }
    }
    return dividers;
}

export function OperationCell<TData>({row, depth = 0, params}: OperationCellProps<TData>) {
    const {name, operationParams, lines = ''} = params;

    const hasVisibleSubNodes = row.getLeafRows().length > 0 && row.getIsExpanded();

    const dividers = React.useMemo(
        () => getDividers(lines, hasVisibleSubNodes),
        [lines, hasVisibleSubNodes],
    );

    return (
        <div
            style={{
                paddingLeft: LEVEL_PADDING * depth,
            }}
            className={block('operation-name')}
        >
            {dividers}
            <Flex gap={1} className={block('operation-content')}>
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
                <div className={block('operation-name-content')}>
                    {/* wrapper to inline elements */}
                    <div>
                        <span className={block('operation-name')}>{name}</span>
                        &nbsp;
                        <OperationParams params={operationParams} />
                    </div>
                </div>
            </Flex>
        </div>
    );
}
