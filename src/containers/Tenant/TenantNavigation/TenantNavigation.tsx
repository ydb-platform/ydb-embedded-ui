import type {SegmentedRadioGroupOptionProps} from '@gravity-ui/uikit';
import {Icon, SegmentedRadioGroup} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';

import {useTenantNavigation} from './useTenantNavigation';

import './TenantNavigation.scss';

const b = cn('ydb-tenant-navigation');

type MenuItem = ReturnType<typeof useTenantNavigation>[0];

const transformItemToOption = ({id, title, icon}: MenuItem): SegmentedRadioGroupOptionProps => {
    const content = (
        <span className={b('item')}>
            <Icon data={icon} size={16} className={b('icon')} />
            <span className={b('text')}>{title}</span>
        </span>
    );

    return {value: id, content};
};

export const TenantNavigation = () => {
    const navigationItems = useTenantNavigation();

    const handleUpdate = (value: string) => {
        const nextItem = navigationItems.find((item) => item.id === value);

        nextItem?.onForward();
    };

    const getCurrentItem = () => navigationItems.find((item) => item.current) || navigationItems[0];

    return (
        <div className={b()}>
            <SegmentedRadioGroup
                width="auto"
                onUpdate={handleUpdate}
                size="l"
                className={b('body')}
                value={getCurrentItem().id}
                options={navigationItems.map(transformItemToOption)}
            />
        </div>
    );
};
