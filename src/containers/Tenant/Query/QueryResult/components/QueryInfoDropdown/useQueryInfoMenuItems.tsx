import React from 'react';

import {ArrowDownToLine, ArrowUpRightFromSquare} from '@gravity-ui/icons';
import type {DropdownMenuItem} from '@gravity-ui/uikit';
import {Text} from '@gravity-ui/uikit';

import {planToSvgApi} from '../../../../../../store/reducers/planToSvg';
import type {QueryPlan, ScriptPlan, TKqpStatsQuery} from '../../../../../../types/api/query';
import createToast from '../../../../../../utils/createToast';
import {createAndDownloadJsonFile, downloadFile} from '../../../../../../utils/downloadFile';
import {prepareCommonErrorMessage} from '../../../../../../utils/errors';
import {parseQueryError} from '../../../../../../utils/query';
import i18n from '../../i18n';

import {b} from './shared';

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
                            theme: 'danger',
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
                    if (url) {
                        downloadFile(url, 'query-plan.svg');
                    }
                });
            };

            menuItems.push([
                {
                    text: (
                        <MenuItemContent
                            title={i18n('text_open-execution-plan')}
                            description={i18n('text_open-execution-plan_description')}
                        />
                    ),
                    iconStart: <ArrowUpRightFromSquare className={b('icon')} />,
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
                    iconStart: <ArrowDownToLine className={b('icon')} />,
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
                    ...(parsedError && {error: parsedError}),
                };

                createAndDownloadJsonFile(
                    diagnosticsData,
                    `query-diagnostics-${new Date().getTime()}`,
                );
            };

            menuItems.push([
                {
                    text: (
                        <MenuItemContent
                            title={i18n('text_diagnostics')}
                            description={i18n('text_diagnostics_description')}
                        />
                    ),
                    iconStart: <ArrowDownToLine className={b('icon')} />,
                    action: handleDiagnosticsDownload,
                    className: b('menu-item'),
                },
            ]);
        }

        return menuItems;
    }, [queryResultsInfo, hasPlanToSvg, blobUrl, getPlanToSvg, database, error]);

    return {
        isLoading,
        items,
    };
}
