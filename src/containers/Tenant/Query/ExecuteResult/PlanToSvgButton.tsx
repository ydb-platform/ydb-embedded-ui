import React from 'react';

import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import {Button, Tooltip} from '@gravity-ui/uikit';

import type {QueryPlan, ScriptPlan} from '../../../../types/api/query';

import {usePlanToSvg} from './hooks';
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
    const {error, blobUrl, isLoading, isUninitialized} = usePlanToSvg(database, plan);

    const handleClick = React.useCallback(() => {
        if (blobUrl) {
            window.open(blobUrl, '_blank');
        }
    }, [blobUrl]);

    if (isUninitialized) {
        return null;
    }

    return (
        <Tooltip
            content={error ? i18n('text_error-plan-svg', {error}) : i18n('text_open-plan-svg')}
        >
            <Button
                view={getButtonView(error, isLoading)}
                loading={isLoading}
                onClick={handleClick}
                disabled={isLoading || !blobUrl}
            >
                {i18n('text_plan-svg')}
                <Button.Icon>
                    <ArrowUpRightFromSquare />
                </Button.Icon>
            </Button>
        </Tooltip>
    );
}
