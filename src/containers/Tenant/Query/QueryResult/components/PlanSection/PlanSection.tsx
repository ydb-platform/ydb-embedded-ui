import React from 'react';

import type {PreparedPlan, PreparedQueryData} from '../../../../../../store/reducers/query/types';
import type {TKqpStatsQuery} from '../../../../../../types/api/query';
import {RESULT_OPTIONS_IDS} from '../../constants';
import type {SectionID} from '../../constants';
import i18n from '../../i18n';
import {Ast} from '../Ast/Ast';
import {Graph} from '../Graph/Graph';
import {QueryJSONViewer} from '../QueryJSONViewer/QueryJSONViewer';
import {SimplifiedPlan} from '../SimplifiedPlan/SimplifiedPlan';
import {StubMessage} from '../Stub/Stub';

interface PlanSectionProps {
    activeSection: SectionID;
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
        case RESULT_OPTIONS_IDS.schema: {
            if (!preparedPlan?.nodes?.length) {
                return <StubMessage message={stubMessage} />;
            }
            return <Graph theme={theme} explain={preparedPlan} />;
        }
        case RESULT_OPTIONS_IDS.json: {
            if (!preparedPlan?.pristine) {
                return <StubMessage message={stubMessage} />;
            }
            return <QueryJSONViewer data={preparedPlan.pristine} />;
        }
        case RESULT_OPTIONS_IDS.simplified: {
            if (!simplifiedPlan?.plan?.length) {
                return <StubMessage message={stubMessage} />;
            }
            return <SimplifiedPlan plan={simplifiedPlan.plan} />;
        }
        case RESULT_OPTIONS_IDS.stats: {
            if (!stats) {
                return <StubMessage message={stubMessage} />;
            }
            return <QueryJSONViewer data={stats} />;
        }
        case RESULT_OPTIONS_IDS.ast: {
            if (!ast) {
                return <StubMessage message={stubMessage} />;
            }
            return <Ast ast={ast} theme={theme} />;
        }
        default:
            return null;
    }
}
