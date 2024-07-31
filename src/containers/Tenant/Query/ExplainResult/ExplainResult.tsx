import React from 'react';

import {RadioButton} from '@gravity-ui/uikit';

import Divider from '../../../../components/Divider/Divider';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import {QUERY_SETTINGS} from '../../../../lib';
import type {PreparedExplainResponse} from '../../../../store/reducers/explainQuery/types';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import type {ValueOf} from '../../../../types/common';
import {cn} from '../../../../utils/cn';
import {useSetting, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import {QuerySettingsBanner} from '../QuerySettingsBanner/QuerySettingsBanner';

import {Ast} from './components/Ast/Ast';
import {Graph} from './components/Graph/Graph';
import {SimplifiedPlan} from './components/SimplifiedPlan/SimplifiedPlan';
import {TextExplain} from './components/TextExplain/TextExplain';
import i18n from './i18n';

import './ExplainResult.scss';

const b = cn('ydb-query-explain-result');

const EXPLAIN_OPTIONS_IDS = {
    schema: 'schema',
    json: 'json',
    ast: 'ast',
    simplified: 'simplified',
} as const;

export type QueryExplainTab = ValueOf<typeof EXPLAIN_OPTIONS_IDS>;

const EXPLAIN_OPTIONS_NAMES: Record<QueryExplainTab, string> = {
    [EXPLAIN_OPTIONS_IDS.schema]: i18n('action.schema'),
    [EXPLAIN_OPTIONS_IDS.json]: i18n('action.json'),
    [EXPLAIN_OPTIONS_IDS.ast]: i18n('action.ast'),
    [EXPLAIN_OPTIONS_IDS.simplified]: i18n('action.explain-plan'),
};

const explainOptions = [
    {value: EXPLAIN_OPTIONS_IDS.schema, content: EXPLAIN_OPTIONS_NAMES[EXPLAIN_OPTIONS_IDS.schema]},
    {
        value: EXPLAIN_OPTIONS_IDS.simplified,
        content: EXPLAIN_OPTIONS_NAMES[EXPLAIN_OPTIONS_IDS.simplified],
    },
    {value: EXPLAIN_OPTIONS_IDS.json, content: EXPLAIN_OPTIONS_NAMES[EXPLAIN_OPTIONS_IDS.json]},
    {value: EXPLAIN_OPTIONS_IDS.ast, content: EXPLAIN_OPTIONS_NAMES[EXPLAIN_OPTIONS_IDS.ast]},
];

interface ExplainResultProps {
    theme: string;
    explain?: PreparedExplainResponse['plan'];
    simplifiedPlan?: PreparedExplainResponse['simplifiedPlan'];
    ast?: string;
    loading?: boolean;
    isResultsCollapsed?: boolean;
    error: unknown;
    onCollapseResults: VoidFunction;
    onExpandResults: VoidFunction;
}

export function ExplainResult({
    explain,
    ast,
    theme,
    error,
    loading,
    onCollapseResults,
    onExpandResults,
    isResultsCollapsed,
    simplifiedPlan,
}: ExplainResultProps) {
    const dispatch = useTypedDispatch();
    const [activeOption, setActiveOption] = React.useState<QueryExplainTab>(
        EXPLAIN_OPTIONS_IDS.schema,
    );
    const [isPending, startTransition] = React.useTransition();

    const isFullscreen = useTypedSelector((state) => state.fullscreen);

    const [useQuerySettings] = useSetting<boolean>(QUERY_SETTINGS);

    React.useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, [dispatch]);

    const renderStub = () => {
        return (
            <div className={b('text-message')}>
                {i18n('description.empty-result', {
                    activeOption: EXPLAIN_OPTIONS_NAMES[activeOption],
                })}
            </div>
        );
    };

    const renderContent = () => {
        if (error) {
            return <div className={b('text-message')}>{parseQueryErrorToString(error)}</div>;
        }

        switch (activeOption) {
            case EXPLAIN_OPTIONS_IDS.json: {
                if (!explain?.pristine) {
                    return renderStub();
                }
                return <TextExplain explain={explain.pristine} />;
            }
            case EXPLAIN_OPTIONS_IDS.ast: {
                if (!ast) {
                    return renderStub();
                }
                return <Ast ast={ast} theme={theme} />;
            }
            case EXPLAIN_OPTIONS_IDS.schema: {
                if (!explain?.nodes?.length) {
                    return renderStub();
                }
                return <Graph theme={theme} explain={explain} />;
            }
            case EXPLAIN_OPTIONS_IDS.simplified: {
                if (!simplifiedPlan?.length) {
                    return renderStub();
                }
                return <SimplifiedPlan plan={simplifiedPlan} />;
            }
            default:
                return null;
        }
    };

    return (
        <React.Fragment>
            <div className={b('controls')}>
                {!loading && (
                    <React.Fragment>
                        <div className={b('controls-right')}>
                            <QueryExecutionStatus error={error} />
                            {!error && (
                                <React.Fragment>
                                    <Divider />
                                    <RadioButton
                                        options={explainOptions}
                                        value={activeOption}
                                        onUpdate={(tabId) => {
                                            startTransition(() => setActiveOption(tabId));
                                        }}
                                    />
                                </React.Fragment>
                            )}
                        </div>
                        <div className={b('controls-left')}>
                            <EnableFullscreenButton disabled={Boolean(error)} />
                            <PaneVisibilityToggleButtons
                                onCollapse={onCollapseResults}
                                onExpand={onExpandResults}
                                isCollapsed={isResultsCollapsed}
                                initialDirection="bottom"
                            />
                        </div>
                    </React.Fragment>
                )}
            </div>
            {useQuerySettings && <QuerySettingsBanner />}
            <LoaderWrapper loading={loading || isPending}>
                {/* this is a hack: only one Graph component may be in DOM because of it's canvas id */}
                {activeOption === EXPLAIN_OPTIONS_IDS.schema && isFullscreen ? null : (
                    <div className={b('result')}>{renderContent()}</div>
                )}
                {isFullscreen && <Fullscreen>{renderContent()}</Fullscreen>}
            </LoaderWrapper>
        </React.Fragment>
    );
}