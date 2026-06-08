import React from 'react';

import {Check} from '@gravity-ui/icons';
import type {LabelProps} from '@gravity-ui/uikit';
import {Flex, Icon, Label, Text} from '@gravity-ui/uikit';

import {ECapacityAlert} from '../../../../types/api/enums';
import {saveToSessionStorage} from '../../../../utils';
import {b} from '../constants';
import i18n from '../i18n';

import {getSpaceLegendSelection} from './getSpaceLegendSelection';

import './SpaceLegend.scss';

interface SpaceLegendProps {
    className?: string;
}

interface SpaceLegendItem {
    id: ECapacityAlert;
    text: string;
    theme?: LabelProps['theme'];
    customClass?: string;
}

const STORAGE_KEY = 'ydb-space-legend-inactive';

const legendItems: SpaceLegendItem[] = [
    {id: ECapacityAlert.GREEN, text: i18n('space_green'), customClass: b('label', {green: true})},
    {id: ECapacityAlert.CYAN, text: i18n('space_cyan'), customClass: b('label', {cyan: true})},
    {
        id: ECapacityAlert.LIGHTYELLOW,
        text: i18n('space_light-yellow'),
        customClass: b('label', {'light-yellow': true}),
    },
    {
        id: ECapacityAlert.YELLOW,
        text: i18n('space_yellow'),
        customClass: b('label', {yellow: true}),
    },
    {
        id: ECapacityAlert.LIGHTORANGE,
        text: i18n('space_light-orange'),
        customClass: b('label', {'light-orange': true}),
    },
    {
        id: ECapacityAlert.PREORANGE,
        text: i18n('space_pre-orange'),
        customClass: b('label', {'pre-orange': true}),
    },
    {
        id: ECapacityAlert.ORANGE,
        text: i18n('space_orange'),
        customClass: b('label', {orange: true}),
    },
    {id: ECapacityAlert.RED, text: i18n('space_red'), customClass: b('label', {red: true})},
    {id: ECapacityAlert.BLACK, text: i18n('space_black'), customClass: b('label', {black: true})},
];

export function SpaceLegend({className}: SpaceLegendProps) {
    // Load inactive ECapacityAlert values
    const [inactiveAlerts, setInactiveAlerts] =
        React.useState<Set<ECapacityAlert>>(getSpaceLegendSelection);

    const toggleItem = React.useCallback((id: ECapacityAlert) => {
        setInactiveAlerts((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            saveToSessionStorage(STORAGE_KEY, Array.from(next));
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('spaceLegendChange'));
            return next;
        });
    }, []);

    return (
        <Flex className={className} gap={2} alignItems="center" wrap="wrap">
            <Flex gap={2} alignItems="center" wrap="wrap">
                {legendItems.map(({id, text, theme, customClass}) => {
                    const isActive = !inactiveAlerts.has(id);

                    return (
                        <Label
                            key={id}
                            size="xs"
                            theme={theme}
                            className={customClass}
                            onClick={() => toggleItem(id)}
                            icon={
                                <div className={b('label-icon', {selected: isActive})}>
                                    {isActive ? <Icon data={Check} size={12} /> : null}
                                </div>
                            }
                        >
                            {text}
                        </Label>
                    );
                })}
            </Flex>
            <Text className={b('empty-statistics')} color="secondary">
                {i18n('context_no-statistics')}
            </Text>
        </Flex>
    );
}
