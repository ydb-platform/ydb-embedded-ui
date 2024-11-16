import React from 'react';

import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import {Button, Tooltip} from '@gravity-ui/uikit';

import {planToSvgApi} from '../../../../store/reducers/planToSvg';
import type {QueryPlan, ScriptPlan} from '../../../../types/api/query';

import i18n from './i18n';

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

    const handleClick = React.useCallback(() => {
        getPlanToSvg({plan, database})
            .unwrap()
            .then((result) => {
                const blob = new Blob([result], {type: 'image/svg+xml'});
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
                setError(null);
                window.open(url, '_blank');
            })
            .catch((err) => {
                setError(JSON.stringify(err));
            });
    }, [database, getPlanToSvg, plan]);

    React.useEffect(() => {
        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [blobUrl]);

    return (
        <Tooltip
            content={error ? i18n('text_error-plan-svg', {error}) : i18n('text_open-plan-svg')}
        >
            <Button
                view={getButtonView(error, isLoading)}
                loading={isLoading}
                onClick={handleClick}
                disabled={isLoading}
            >
                {i18n('text_plan-svg')}
                <Button.Icon>
                    <ArrowUpRightFromSquare />
                </Button.Icon>
            </Button>
        </Tooltip>
    );
}
