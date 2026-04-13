import React from 'react';

import type {
    DropdownMenuItem,
    DropdownMenuProps as GravityDropdownMenuProps,
    IconProps,
} from '@gravity-ui/uikit';
import {Flex, DropdownMenu as GravityDropdownMenu, Icon, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import './DropdownMenu.scss';

const b = cn('ydb-dropdown-menu');

export interface DropdownMenuItemWithDescription<T = HTMLElement>
    extends Omit<DropdownMenuItem<T>, 'text' | 'iconStart'> {
    description?: React.ReactNode;
    iconStart?: IconProps['data'];
}

export interface DropdownMenuProps<T = HTMLElement>
    extends Omit<GravityDropdownMenuProps<T>, 'items'> {
    items: (DropdownMenuItemWithDescription<T> | DropdownMenuItemWithDescription<T>[])[];
}

function renderMenuItemText({
    title,
    description,
}: Pick<DropdownMenuItemWithDescription, 'title' | 'description'>) {
    return (
        <Flex direction="column" className={b('item-content')}>
            <Text className={b('item-title')}>{title}</Text>
            {description ? (
                <Text color="secondary" className={b('item-description')}>
                    {description}
                </Text>
            ) : null}
        </Flex>
    );
}

function mapMenuItem<T = HTMLElement>(
    item: DropdownMenuItemWithDescription<T>,
): DropdownMenuItem<T> {
    const {title, description, iconStart, ...restItem} = item;

    return {
        ...restItem,
        text: renderMenuItemText({title, description}),
        iconStart: iconStart ? (
            <Icon
                data={iconStart}
                className={b('icon', {'with-description': Boolean(description)})}
            />
        ) : undefined,
        className: b('menu-item', {'with-description': Boolean(description)}),
    } as DropdownMenuItem<T>;
}

export function DropdownMenu<T = HTMLElement>({items, ...props}: DropdownMenuProps<T>) {
    const mappedItems = React.useMemo<GravityDropdownMenuProps<T>['items']>(() => {
        return items.map((group) => {
            if (Array.isArray(group)) {
                return group.map(mapMenuItem);
            }

            return mapMenuItem(group);
        });
    }, [items]);

    return <GravityDropdownMenu {...props} items={mappedItems} menuProps={{size: 'l'}} />;
}
