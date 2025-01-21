import React from 'react';

import {ArrowDownToLine, ArrowUpRightFromSquare} from '@gravity-ui/icons';
import type {DropdownMenuItem} from '@gravity-ui/uikit';
import {Text} from '@gravity-ui/uikit';

import {planToSvgApi} from '../../../../../../store/reducers/planToSvg';
import type {QueryPlan, ScriptPlan, TKqpStatsQuery} from '../../../../../../types/api/query';
import {cn} from '../../../../../../utils/cn';
import createToast from '../../../../../../utils/createToast';
import {prepareCommonErrorMessage} from '../../../../../../utils/errors';
import {parseQueryError} from '../../../../../../utils/query';
import i18n from '../../i18n';
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

export interface QueryResultsInfo {
    ast?: string;
    stats?: TKqpStatsQuery;
    queryText?: string;
    plan?: QueryPlan | ScriptPlan;
}

export interface DiagnosticsData extends QueryResultsInfo {
    database: string;
    timestamp: string;
    error?: ReturnType<typeof parseQueryError>;
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
            const handleGetSvg = () => {
                if (blobUrl) {
                    return Promise.resolve(blobUrl);
                }

                return getPlanToSvg({plan, database})
                    .unwrap()
                    .then((result) => {
                        const blob = new Blob([result], {type: 'image/svg+xml'});
                        const url = URL.createObjectURL(blob);
                        setBlobUrl(url);
                        return url;
                    })
                    .catch((err) => {
                        const errorMessage = prepareCommonErrorMessage(err);
                        createToast({
                            title: i18n('text_error-plan-svg', {error: errorMessage}),
                            name: 'plan-svg-error',
                            type: 'error',
                        });
                        return null;
                    });
            };

            const handleOpenInNewTab = () => {
                handleGetSvg().then((url) => {
                    if (url) {
                        window.open(url, '_blank');
                    }
                });
            };

            const handleDownload = () => {
                handleGetSvg().then((url) => {
                    const link = document.createElement('a');
                    if (url) {
                        link.href = url;
                        link.download = 'query-plan.svg';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                });
            };

            menuItems.push([
                {
                    text: (
                        <MenuItemContent
                            title={i18n('text_open-new-tab')}
                            description={i18n('text_open-new-tab_description')}
                        />
                    ),
                    icon: <ArrowUpRightFromSquare className={b('icon')} />,
                    action: handleOpenInNewTab,
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
                    action: handleDownload,
                    className: b('menu-item'),
                },
            ]);
        }

        if (queryResultsInfo) {
            const handleDiagnosticsDownload = () => {
                const parsedError = error ? parseQueryError(error) : undefined;
                const diagnosticsData: DiagnosticsData = {
                    ...queryResultsInfo,
                    database,
                    timestamp: new Date().toISOString(),
                    ...(parsedError && {error: parsedError}),
                };

                const blob = new Blob([JSON.stringify(diagnosticsData, null, 2)], {
                    type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `query-diagnostics-${new Date().getTime()}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            };

            menuItems.push([
                {
                    text: (
                        <MenuItemContent
                            title={i18n('text_diagnostics')}
                            description={i18n('text_diagnostics_description')}
                        />
                    ),
                    icon: <ArrowDownToLine className={b('icon')} />,
                    action: handleDiagnosticsDownload,
                    className: b('menu-item'),
                },
            ]);
        }

        return menuItems;
    }, [queryResultsInfo, hasPlanToSvg, blobUrl, getPlanToSvg, database]);

    return {
        isLoading,
        items,
    };
}
