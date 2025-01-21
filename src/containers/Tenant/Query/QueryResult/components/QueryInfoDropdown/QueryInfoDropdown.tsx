import {Ellipsis} from '@gravity-ui/icons';
import type {ButtonProps} from '@gravity-ui/uikit';
import {Button, DropdownMenu, Tooltip} from '@gravity-ui/uikit';

import i18n from '../../i18n';

import type {QueryResultsInfo} from './useQueryInfoMenuItems';
import {useQueryInfoMenuItems} from './useQueryInfoMenuItems';

import './QueryInfoDropdown.scss';

interface QueryInfoDropdownProps {
    queryResultsInfo: QueryResultsInfo;
    database: string;
    hasPlanToSvg: boolean;
}

export function QueryInfoDropdown({
    queryResultsInfo,
    database,
    hasPlanToSvg,
}: QueryInfoDropdownProps) {
    const {error, isLoading, items} = useQueryInfoMenuItems({
        queryResultsInfo,
        database,
        hasPlanToSvg,
    });

    const renderSwitcher = (props: ButtonProps) => {
        return (
            <Tooltip content={error ? i18n('text_error-plan-svg', {error}) : i18n('text_plan-svg')}>
                <Button view="flat-secondary" loading={isLoading} disabled={isLoading} {...props}>
                    <Button.Icon>
                        <Ellipsis />
                    </Button.Icon>
                </Button>
            </Tooltip>
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
            renderSwitcher={renderSwitcher}
            items={items}
            size="xl"
        />
    );
}
