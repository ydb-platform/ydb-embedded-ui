import {Code, LayoutList, NodesDown} from '@gravity-ui/icons';
import {Flex, Icon, SegmentedRadioGroup} from '@gravity-ui/uikit';

import type {PreparedQueryData, QueryPlanView} from '../../../../../../store/reducers/query/types';
import {cn} from '../../../../../../utils/cn';
import {RESULT_OPTIONS_IDS} from '../../constants';
import type {SectionID} from '../../constants';
import i18n from '../../i18n';
import {Ast} from '../Ast/Ast';
import {ExecutionPlan} from '../ExecutionPlan/ExecutionPlan';
import {Graph} from '../Graph/Graph';
import {QueryJSONViewer} from '../QueryJSONViewer/QueryJSONViewer';
import {SimplifiedPlan} from '../SimplifiedPlan/SimplifiedPlan';
import {StubMessage} from '../Stub/Stub';

import './PlanSection.scss';

const b = cn('ydb-query-plan');

interface PlanSectionProps {
    activeSection: SectionID;
    sectionTitle: string;
    data: PreparedQueryData;
    planView: QueryPlanView;
    columnSizing?: Record<string, number>;
    onColumnSizingChange: (sizing: Record<string, number>) => void;
    onPlanViewChange: (view: QueryPlanView) => void;
    database: string;
    executionId: string;
    theme?: string;
}

export function PlanSection({
    activeSection,
    sectionTitle,
    data,
    planView,
    columnSizing,
    onColumnSizingChange,
    onPlanViewChange,
    database,
    executionId,
    theme,
}: PlanSectionProps) {
    const {preparedPlan, simplifiedPlan, plan, stats, ast} = data;
    const empty = (
        <StubMessage message={i18n('description.empty-result', {activeSection: sectionTitle})} />
    );
    const renderQueryPlan = () => {
        switch (planView) {
            case 'table':
                return simplifiedPlan?.plan?.length ? (
                    <SimplifiedPlan
                        key={executionId}
                        plan={simplifiedPlan.plan}
                        columnSizing={columnSizing}
                        onColumnSizingChange={onColumnSizingChange}
                    />
                ) : (
                    empty
                );
            case 'graph':
                return preparedPlan?.nodes?.length ? (
                    <Graph theme={theme} explain={preparedPlan} />
                ) : (
                    empty
                );
            case 'json':
                return plan || preparedPlan?.pristine ? (
                    <QueryJSONViewer data={plan ?? preparedPlan?.pristine} />
                ) : (
                    empty
                );
        }
        return empty;
    };

    switch (activeSection) {
        case RESULT_OPTIONS_IDS.queryPlan:
            return (
                <div className={b()}>
                    <SegmentedRadioGroup<QueryPlanView>
                        className={b('switcher')}
                        value={planView}
                        onUpdate={onPlanViewChange}
                        aria-label={i18n('title_query-plan-view')}
                    >
                        <SegmentedRadioGroup.Option value="table">
                            <Flex gap={2} alignItems="center">
                                <Icon data={LayoutList} size={16} />
                                {i18n('action_table')}
                            </Flex>
                        </SegmentedRadioGroup.Option>
                        <SegmentedRadioGroup.Option value="graph">
                            <Flex gap={2} alignItems="center">
                                <Icon data={NodesDown} size={16} />
                                {i18n('action_graph')}
                            </Flex>
                        </SegmentedRadioGroup.Option>
                        <SegmentedRadioGroup.Option value="json">
                            <Flex gap={2} alignItems="center">
                                <Icon data={Code} size={16} />
                                {i18n('action.json')}
                            </Flex>
                        </SegmentedRadioGroup.Option>
                    </SegmentedRadioGroup>
                    <div className={b('content', {view: planView})}>{renderQueryPlan()}</div>
                </div>
            );
        case RESULT_OPTIONS_IDS.executionPlan:
            return <ExecutionPlan key={executionId} database={database} plan={plan} />;
        case RESULT_OPTIONS_IDS.stats:
            return stats ? <QueryJSONViewer data={stats} /> : empty;
        case RESULT_OPTIONS_IDS.ast:
            return ast ? <Ast ast={ast} theme={theme} /> : empty;
        default:
            return null;
    }
}
