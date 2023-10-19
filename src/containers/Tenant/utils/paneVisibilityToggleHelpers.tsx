import React from 'react';
import {Button} from '@gravity-ui/uikit';
import cn from 'bem-cn-lite';

import {Icon} from '../../../components/Icon';

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
    return (
        <React.Fragment>
            <Button
                view="flat-secondary"
                onClick={onCollapse}
                className={b(
                    {
                        hidden: isCollapsed,
                    },
                    className,
                )}
                title="Collapse"
            >
                <Icon
                    name="collapse"
                    viewBox="0 0 384 512"
                    width={14}
                    height={14}
                    className={b({[initialDirection]: true})}
                />
            </Button>
            <Button
                view="flat-secondary"
                onClick={onExpand}
                className={b(
                    {
                        hidden: !isCollapsed,
                    },
                    className,
                )}
                title="Expand"
            >
                <Icon
                    name="collapse"
                    viewBox="0 0 384 512"
                    width={14}
                    height={14}
                    className={b({[initialDirection]: true}, 'rotate')}
                />
            </Button>
        </React.Fragment>
    );
}
