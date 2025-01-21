import React from 'react';

import {ArrowDownToLine, ArrowUpRightFromSquare} from '@gravity-ui/icons';
import type {DropdownMenuItem} from '@gravity-ui/uikit';
import {Text} from '@gravity-ui/uikit';

import {planToSvgApi} from '../../../../../../store/reducers/planToSvg';
import {cn} from '../../../../../../utils/cn';
import i18n from '../../i18n';

import {
    createHandleDiagnosticsDownload,
    createHandleDownload,
    createHandleOpenInNewTab,
} from './utils';
import type {QueryResultsInfo} from './utils';
const b = cn('query-info-dropdown');

export interface MenuItemContentProps {
    title: string;
    description: string;
}

export function MenuItemContent({title, description}: MenuItemContentProps) {
    return (
        <div className={b('menu-item-content')}>
            <Text variant="body-1">{title}</Text>
            <Text variant="body-1" color="secondary">
                {description}
            </Text>
        </div>
    );
}

export interface UseQueryInfoMenuItemsProps {
    queryResultsInfo: QueryResultsInfo;
    database: string;
    hasPlanToSvg: boolean;
    error?: unknown;
}

export function useQueryInfoMenuItems({
    queryResultsInfo,
    database,
    hasPlanToSvg,
    error,
}: UseQueryInfoMenuItemsProps) {
    const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
    const [getPlanToSvg, {isLoading}] = planToSvgApi.useLazyPlanToSvgQueryQuery();

    React.useEffect(() => {
        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [blobUrl]);

    const items = React.useMemo<DropdownMenuItem[][]>(() => {
        const menuItems: DropdownMenuItem[][] = [];

        const plan = queryResultsInfo.plan;
        if (plan && hasPlanToSvg) {
            const handlersParams = {
                plan,
                database,
                blobUrl,
                getPlanToSvg,
                setBlobUrl,
            };

            menuItems.push([
                {
                    text: (
                        <MenuItemContent
                            title={i18n('text_open-execution-plan')}
                            description={i18n('text_open-execution-plan_description')}
                        />
                    ),
                    icon: <ArrowUpRightFromSquare className={b('icon')} />,
                    action: createHandleOpenInNewTab(handlersParams),
                    className: b('menu-item'),
                },
                {
                    text: (
                        <MenuItemContent
                            title={i18n('text_download')}
                            description={i18n('text_download_description')}
                        />
                    ),
                    icon: <ArrowDownToLine className={b('icon')} />,
                    action: createHandleDownload(handlersParams),
                    className: b('menu-item'),
                },
            ]);
        }

        if (queryResultsInfo) {
            menuItems.push([
                {
                    text: (
                        <MenuItemContent
                            title={i18n('text_diagnostics')}
                            description={i18n('text_diagnostics_description')}
                        />
                    ),
                    icon: <ArrowDownToLine className={b('icon')} />,
                    action: createHandleDiagnosticsDownload({queryResultsInfo, database, error}),
                    className: b('menu-item'),
                },
            ]);
        }

        return menuItems;
    }, [queryResultsInfo, hasPlanToSvg, database, blobUrl, getPlanToSvg, error]);

    return {
        isLoading,
        items,
    };
}
