import {Ellipsis} from '@gravity-ui/icons';
import type {ButtonProps} from '@gravity-ui/uikit';
import {ActionTooltip, Button, DropdownMenu} from '@gravity-ui/uikit';

import i18n from '../../i18n';

import {b} from './shared';
import type {QueryResultsInfo} from './useQueryInfoMenuItems';
import {useQueryInfoMenuItems} from './useQueryInfoMenuItems';

import './QueryInfoDropdown.scss';

export interface QueryInfoDropdownProps {
    queryResultsInfo: QueryResultsInfo;
    database: string;
    hasPlanToSvg: boolean;
    error?: unknown;
}

export function QueryInfoDropdown({
    queryResultsInfo,
    database,
    hasPlanToSvg,
    error,
}: QueryInfoDropdownProps) {
    const {isLoading, items} = useQueryInfoMenuItems({
        queryResultsInfo,
        database,
        hasPlanToSvg,
        error,
    });

    const renderSwitcher = (props: ButtonProps) => {
        return (
            <ActionTooltip title={i18n('tooltip_actions')}>
                <Button view="flat-secondary" loading={isLoading} disabled={isLoading} {...props}>
                    <Button.Icon>
                        <Ellipsis />
                    </Button.Icon>
                </Button>
            </ActionTooltip>
        );
    };

    if (!items.length) {
        return null;
    }

    return (
        <DropdownMenu
            popupProps={{
                placement: ['bottom-end', 'left'],
            }}
            switcherWrapperClassName={b('query-info-switcher-wrapper')}
            renderSwitcher={renderSwitcher}
            items={items}
            size="xl"
        />
    );
}
