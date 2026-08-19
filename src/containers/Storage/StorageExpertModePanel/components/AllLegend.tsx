import React from 'react';

import type {SelectOption} from '@gravity-ui/uikit';
import {Flex, Label, Select} from '@gravity-ui/uikit';

import {ECapacityAlert, isCapacityAlert} from '../../../../types/api/enums';
import {b} from '../constants';
import i18n from '../i18n';

import type {SpaceLegendSelectionScope} from './getSpaceLegendSelection';
import {saveSpaceLegendSelection} from './getSpaceLegendSelection';
import {useSpaceLegendSelection} from './useSpaceLegendSelection';

interface AllLegendProps {
    className?: string;
    selectionScope?: SpaceLegendSelectionScope;
}

interface CapacityAlertOptionData {
    shortText: string;
    className: string;
}

const capacityAlertOptions: SelectOption<CapacityAlertOptionData>[] = [
    {
        value: ECapacityAlert.GREEN,
        content: i18n('capacity-alert_green'),
        data: {shortText: i18n('space_green'), className: b('label', {green: true})},
    },
    {
        value: ECapacityAlert.CYAN,
        content: i18n('capacity-alert_cyan'),
        data: {shortText: i18n('space_cyan'), className: b('label', {cyan: true})},
    },
    {
        value: ECapacityAlert.LIGHTYELLOW,
        content: i18n('capacity-alert_light-yellow'),
        data: {
            shortText: i18n('space_light-yellow'),
            className: b('label', {'light-yellow': true}),
        },
    },
    {
        value: ECapacityAlert.YELLOW,
        content: i18n('capacity-alert_yellow'),
        data: {shortText: i18n('space_yellow'), className: b('label', {yellow: true})},
    },
    {
        value: ECapacityAlert.LIGHTORANGE,
        content: i18n('capacity-alert_light-orange'),
        data: {
            shortText: i18n('space_light-orange'),
            className: b('label', {'light-orange': true}),
        },
    },
    {
        value: ECapacityAlert.PREORANGE,
        content: i18n('capacity-alert_pre-orange'),
        data: {
            shortText: i18n('space_pre-orange'),
            className: b('label', {'pre-orange': true}),
        },
    },
    {
        value: ECapacityAlert.ORANGE,
        content: i18n('capacity-alert_orange'),
        data: {shortText: i18n('space_orange'), className: b('label', {orange: true})},
    },
    {
        value: ECapacityAlert.RED,
        content: i18n('capacity-alert_red'),
        data: {shortText: i18n('space_red'), className: b('label', {red: true})},
    },
    {
        value: ECapacityAlert.BLACK,
        content: i18n('capacity-alert_black'),
        data: {shortText: i18n('space_black'), className: b('label', {black: true})},
    },
];

function renderOption(option: SelectOption<CapacityAlertOptionData>) {
    return (
        <Flex
            className={b('capacity-alert-option')}
            alignItems="center"
            justifyContent="space-between"
        >
            <span>{option.content}</span>
            <Label
                className={b('capacity-alert-option-abbreviation', option.data?.className)}
                size="xs"
            >
                {option.data?.shortText}
            </Label>
        </Flex>
    );
}

export function AllLegend({className, selectionScope = 'vdisks'}: AllLegendProps) {
    const inactiveAlerts = useSpaceLegendSelection(selectionScope);

    const activeAlerts = React.useMemo(
        () =>
            capacityAlertOptions
                .map(({value}) => value)
                .filter(isCapacityAlert)
                .filter((alert) => !inactiveAlerts.has(alert)),
        [inactiveAlerts],
    );

    const selectionSummary = React.useMemo(() => {
        if (inactiveAlerts.size === 0) {
            return i18n('capacity-alerts_all');
        }
        if (inactiveAlerts.size === capacityAlertOptions.length) {
            return i18n('capacity-alerts_none');
        }

        const inactiveAlertNames = capacityAlertOptions
            .filter(({value}) => isCapacityAlert(value) && inactiveAlerts.has(value))
            .map(({content}) => content)
            .join(' & ');

        return i18n('capacity-alerts_except', {alerts: inactiveAlertNames});
    }, [inactiveAlerts]);

    const handleUpdate = React.useCallback(
        (values: string[]) => {
            const nextActiveAlerts = new Set(values.filter(isCapacityAlert));
            const nextInactiveAlerts = new Set(
                capacityAlertOptions
                    .map(({value}) => value)
                    .filter(isCapacityAlert)
                    .filter((alert) => !nextActiveAlerts.has(alert)),
            );

            saveSpaceLegendSelection(nextInactiveAlerts, selectionScope);
        },
        [selectionScope],
    );

    const renderSelectedOption = React.useCallback(
        (_option: SelectOption<CapacityAlertOptionData>, index: number) => (
            <React.Fragment>{index === 0 ? selectionSummary : null}</React.Fragment>
        ),
        [selectionSummary],
    );

    return (
        <Select
            className={className}
            label={i18n('label_capacity-alerts')}
            value={activeAlerts}
            options={capacityAlertOptions}
            multiple
            size="s"
            width={261}
            popupWidth={257}
            renderOption={renderOption}
            renderSelectedOption={renderSelectedOption}
            placeholder={selectionSummary}
            onUpdate={handleUpdate}
        />
    );
}
