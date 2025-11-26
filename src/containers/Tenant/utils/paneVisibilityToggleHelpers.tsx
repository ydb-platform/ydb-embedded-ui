import React from 'react';

import {ChevronsUp} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';
import {useResizeObserverTrigger} from '../../../utils/hooks/useResizeObserverTrigger';

import './ToggleButton.scss';

export interface InitialPaneState {
    triggerExpand: boolean;
    triggerCollapse: boolean;
    collapsed: boolean;
}

export enum PaneVisibilityActionTypes {
    triggerCollapse = 'triggerCollapse',
    triggerExpand = 'triggerExpand',
    clear = 'clear',
}

const setInitialIsPaneCollapsed = (key: string) => {
    localStorage.setItem(key, 'true');
};

const deleteInitialIsPaneCollapsed = (key: string) => {
    localStorage.removeItem(key);
};

export function paneVisibilityToggleReducerCreator(isPaneCollapsedKey: string) {
    return function paneVisibilityToggleReducer(
        state: InitialPaneState,
        action: PaneVisibilityActionTypes,
    ) {
        switch (action) {
            case PaneVisibilityActionTypes.triggerCollapse: {
                setInitialIsPaneCollapsed(isPaneCollapsedKey);
                return {
                    ...state,
                    triggerCollapse: true,
                    triggerExpand: false,
                    collapsed: true,
                };
            }
            case PaneVisibilityActionTypes.triggerExpand: {
                deleteInitialIsPaneCollapsed(isPaneCollapsedKey);
                return {
                    ...state,
                    triggerCollapse: false,
                    triggerExpand: true,
                    collapsed: false,
                };
            }
            case PaneVisibilityActionTypes.clear: {
                deleteInitialIsPaneCollapsed(isPaneCollapsedKey);
                return {
                    triggerCollapse: false,
                    triggerExpand: false,
                    collapsed: false,
                };
            }
            default:
                return state;
        }
    };
}

interface ToggleButtonProps {
    onCollapse: VoidFunction;
    onExpand: VoidFunction;
    isCollapsed?: boolean;
    initialDirection?: 'right' | 'left' | 'top' | 'bottom';
    className?: string;
}

const b = cn('kv-pane-visibility-button');

export function PaneVisibilityToggleButtons({
    onCollapse,
    onExpand,
    isCollapsed,
    initialDirection = 'top',
    className,
}: ToggleButtonProps) {
    useResizeObserverTrigger([isCollapsed]);
    return (
        <React.Fragment>
            <ActionTooltip title="Collapse">
                <Button
                    view="flat-secondary"
                    onClick={onCollapse}
                    className={b(
                        {
                            hidden: isCollapsed,
                            type: 'collapse',
                        },
                        className,
                    )}
                >
                    <Icon data={ChevronsUp} className={b({[initialDirection]: true})} />
                </Button>
            </ActionTooltip>

            <ActionTooltip title="Expand">
                <Button
                    view="flat-secondary"
                    onClick={onExpand}
                    className={b(
                        {
                            hidden: !isCollapsed,
                            type: 'expand',
                        },
                        className,
                    )}
                >
                    <Icon data={ChevronsUp} className={b({[initialDirection]: true}, 'rotate')} />
                </Button>
            </ActionTooltip>
        </React.Fragment>
    );
}
