import React from 'react';

import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import {Button, Tooltip} from '@gravity-ui/uikit';

import {planToSvgQueryApi} from '../../../../store/reducers/planToSvgQuery';
import type {QueryPlan, ScriptPlan} from '../../../../types/api/query';

import i18n from './i18n';

function getButtonView(error: string | null, isLoading: boolean) {
    if (error) {
        return 'flat-danger';
    }
    return isLoading ? 'flat-secondary' : 'flat-info';
}

interface PlanToSvgButtonProps {
    plan?: QueryPlan | ScriptPlan;
    database: string;
}

export function PlanToSvgButton({plan, database}: PlanToSvgButtonProps) {
    const [svgData, setSvgData] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [checkPlanToSvg, {isLoading, isUninitialized}] =
        planToSvgQueryApi.usePlanToSvgQueryMutation();

    React.useEffect(() => {
        if (!plan) {
            return;
        }

        checkPlanToSvg({plan, database})
            .unwrap()
            .then((result) => {
                setSvgData(result);
                setError(null);
            })
            .catch((err) => {
                setError(JSON.stringify(err));
            });
    }, [checkPlanToSvg, database, plan]);

    const handleClick = React.useCallback(() => {
        if (svgData) {
            const blob = new Blob([svgData], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        }
    }, [svgData]);

    if (isUninitialized) {
        return null;
    }

    return (
        <Tooltip content={i18n('text_error-plan-svg', {error}) || i18n('text_plan-svg')}>
            <Button
                view={getButtonView(error, isLoading)}
                loading={isLoading}
                onClick={handleClick}
                disabled={isLoading || !svgData}
            >
                {i18n('text_plan-svg')}
                <Button.Icon>
                    <ArrowUpRightFromSquare />
                </Button.Icon>
            </Button>
        </Tooltip>
    );
}
