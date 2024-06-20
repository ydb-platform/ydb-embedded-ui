import React from 'react';

import {cn} from '@bem-react/classname';
import type {RadioButtonOption} from '@gravity-ui/uikit';
import {RadioButton} from '@gravity-ui/uikit';

import {useNavigationMenuItems} from './useNavigationMenuItems';

import './InlineNavigation.scss';

const b = cn('inline-navigation');

type MenuItem = ReturnType<typeof useNavigationMenuItems>[0];

export const InlineNavigation = () => {
    const navigationItems = useNavigationMenuItems();

    const handleUpdate = React.useCallback(
        (value: string) => {
            const nextItem = navigationItems.find((item) => item.id === value);

            nextItem?.onItemClick();
        },
        [navigationItems],
    );

    const getCurrentItem = () => navigationItems.find((item) => item.current) || navigationItems[0];

    const transformItemToOption = ({id, title, icon: Icon}: MenuItem): RadioButtonOption => {
        const content = (
            <span className={b('body__item')}>
                <Icon className={b('body__icon')} />
                {title}
            </span>
        );

        return {value: id, content};
    };

    return (
        <div className={b()}>
            <RadioButton
                width="auto"
                onUpdate={handleUpdate}
                size="l"
                className={b('body')}
                defaultValue={getCurrentItem().id}
                options={Object.values(navigationItems).map(transformItemToOption)}
            />
        </div>
    );
};
