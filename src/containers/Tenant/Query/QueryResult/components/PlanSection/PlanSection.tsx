import React from 'react';

import type {PreparedPlan, PreparedQueryData} from '../../../../../../store/reducers/query/types';
import type {TKqpStatsQuery} from '../../../../../../types/api/query';
import i18n from '../../i18n';
import {Ast} from '../Ast/Ast';
import {Graph} from '../Graph/Graph';
import {QueryJSONViewer} from '../QueryJSONViewer/QueryJSONViewer';
import {SimplifiedPlan} from '../SimplifiedPlan/SimplifiedPlan';
import {StubMessage} from '../Stub/Stub';

interface PlanSectionProps {
    activeSection: string;
    sectionTitle: string;
    preparedPlan?: PreparedPlan;
    simplifiedPlan?: PreparedQueryData['simplifiedPlan'];
    stats?: TKqpStatsQuery;
    ast?: string;
    theme?: string;
}

export function PlanSection({
    activeSection,
    sectionTitle,
    preparedPlan,
    simplifiedPlan,
    stats,
    ast,
    theme,
}: PlanSectionProps) {
    const stubMessage = React.useMemo(
        () => i18n('description.empty-result', {activeSection: sectionTitle}),
        [sectionTitle],
    );

    switch (activeSection) {
        case 'schema': {
            if (!preparedPlan?.nodes?.length) {
                return <StubMessage message={stubMessage} />;
            }
            return <Graph theme={theme} explain={preparedPlan} />;
        }
        case 'json': {
            if (!preparedPlan?.pristine) {
                return <StubMessage message={stubMessage} />;
            }
            return <QueryJSONViewer data={preparedPlan.pristine} />;
        }
        case 'simplified': {
            if (!simplifiedPlan?.plan?.length) {
                return <StubMessage message={stubMessage} />;
            }
            return <SimplifiedPlan plan={simplifiedPlan.plan} />;
        }
        case 'stats': {
            if (!stats) {
                return <StubMessage message={stubMessage} />;
            }
            return <QueryJSONViewer data={stats} />;
        }
        case 'ast': {
            if (!ast) {
                return <StubMessage message={stubMessage} />;
            }
            return <Ast ast={ast} theme={theme} />;
        }
        default:
            return null;
    }
}
