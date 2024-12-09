import React from 'react';

import {ArrowDownToLine, ArrowUpRightFromSquare, ChevronDown} from '@gravity-ui/icons';
import type {ButtonProps} from '@gravity-ui/uikit';
import {Button, DropdownMenu} from '@gravity-ui/uikit';

import {planToSvgApi} from '../../../../../../store/reducers/planToSvg';
import type {QueryPlan, ScriptPlan} from '../../../../../../types/api/query';
import i18n from '../../i18n';

function getButtonView(error: string | null, isLoading: boolean) {
    if (error) {
        return 'flat-danger';
    }
    return isLoading ? 'flat-secondary' : 'flat-info';
}

interface PlanToSvgButtonProps {
    plan: QueryPlan | ScriptPlan;
    database: string;
}

export function PlanToSvgButton({plan, database}: PlanToSvgButtonProps) {
    const [error, setError] = React.useState<string | null>(null);
    const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
    const [getPlanToSvg, {isLoading}] = planToSvgApi.useLazyPlanToSvgQueryQuery();

    const handleGetSvg = React.useCallback(() => {
        if (blobUrl) {
            return Promise.resolve(blobUrl);
        }

        return getPlanToSvg({plan, database})
            .unwrap()
            .then((result) => {
                const blob = new Blob([result], {type: 'image/svg+xml'});
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
                setError(null);
                return url;
            })
            .catch((err) => {
                setError(JSON.stringify(err));
                throw err;
            });
    }, [database, getPlanToSvg, plan, blobUrl]);

    const handleOpenInNewTab = React.useCallback(() => {
        handleGetSvg().then((url) => {
            window.open(url, '_blank');
        });
    }, [handleGetSvg]);

    const handleDownload = React.useCallback(() => {
        handleGetSvg().then((url) => {
            const link = document.createElement('a');
            link.href = url;
            link.download = 'query-plan.svg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }, [handleGetSvg]);

    React.useEffect(() => {
        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [blobUrl]);

    const items = [
        {
            text: i18n('text_open-new-tab'),
            icon: <ArrowUpRightFromSquare />,
            action: handleOpenInNewTab,
        },
        {
            text: i18n('text_download'),
            icon: <ArrowDownToLine />,
            action: handleDownload,
        },
    ];

    const renderSwitcher = (props: ButtonProps) => {
        return (
            <Button
                view={getButtonView(error, isLoading)}
                loading={isLoading}
                disabled={isLoading}
                {...props}
            >
                {i18n('text_plan-svg')}
                <Button.Icon>
                    <ChevronDown />
                </Button.Icon>
            </Button>
        );
    };

    return <DropdownMenu renderSwitcher={renderSwitcher} items={items} />;
}
