import {Ellipsis} from '@gravity-ui/icons';
import type {ButtonProps} from '@gravity-ui/uikit';
import {Button, DropdownMenu} from '@gravity-ui/uikit';

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
    const {isLoading, items} = useQueryInfoMenuItems({
        queryResultsInfo,
        database,
        hasPlanToSvg,
    });

    const renderSwitcher = (props: ButtonProps) => {
        return (
            <Button view="flat-secondary" loading={isLoading} disabled={isLoading} {...props}>
                <Button.Icon>
                    <Ellipsis />
                </Button.Icon>
            </Button>
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
