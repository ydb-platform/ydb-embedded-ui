import React from 'react';

import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import {Button} from '@gravity-ui/uikit';

import {planToSvgQueryApi} from '../../../../store/reducers/planToSvgQuery';
import type {QueryPlan, ScriptPlan} from '../../../../types/api/query';

import i18n from './i18n';

interface PlanToSvgButtonProps {
    plan?: QueryPlan | ScriptPlan;
    database: string;
}

export function PlanToSvgButton({plan, database}: PlanToSvgButtonProps) {
    const [checkPlanToSvg, {isLoading, isUninitialized}] =
        planToSvgQueryApi.usePlanToSvgQueryMutation();

    React.useEffect(() => {
        let checkPlanToSvgMutation: {abort: () => void} | null;
        if (plan) {
            checkPlanToSvgMutation = checkPlanToSvg({plan, database});
        }

        return () => checkPlanToSvgMutation?.abort();
    }, [checkPlanToSvg, database, plan]);

    if (isUninitialized) {
        return null;
    }

    return (
        <Button
            view={isLoading ? 'flat-secondary' : 'flat-info'}
            loading={isLoading}
            target="_blank"
        >
            {i18n('text_plan-svg')}
            <Button.Icon>
                <ArrowUpRightFromSquare />
            </Button.Icon>
        </Button>
    );
}
