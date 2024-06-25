import React from 'react';

import {cn} from '@bem-react/classname';
import type {RadioButtonOption} from '@gravity-ui/uikit';
import {RadioButton} from '@gravity-ui/uikit';

import {useTenantNavigation} from '../hooks/useTenantNavigation';

import './TenantNavigation.scss';

const b = cn('tenant-navigation');

type MenuItem = ReturnType<typeof useTenantNavigation>[0];

export const TenantNavigation = () => {
    const navigationItems = useTenantNavigation();

    const handleUpdate = React.useCallback(
        (value: string) => {
            const nextItem = navigationItems.find((item) => item.id === value);

            nextItem?.onForward();
        },
        [navigationItems],
    );

    const getCurrentItem = () => navigationItems.find((item) => item.current) || navigationItems[0];

    const transformItemToOption = ({id, title, icon: Icon}: MenuItem): RadioButtonOption => {
        const content = (
            <span className={b('body__item')}>
                <span className={b('body__icon')}>{Icon}</span>
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
                options={navigationItems.map(transformItemToOption)}
            />
        </div>
    );
};
