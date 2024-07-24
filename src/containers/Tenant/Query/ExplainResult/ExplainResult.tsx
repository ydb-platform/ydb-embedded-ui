import React from 'react';

import {RadioButton} from '@gravity-ui/uikit';

import Divider from '../../../../components/Divider/Divider';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {Loader} from '../../../../components/Loader';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import type {PreparedExplainResponse} from '../../../../store/reducers/explainQuery/types';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';

import {Ast} from './components/Ast/Ast';
import {Graph} from './components/Graph/Graph';
import {SimplifiedPlan} from './components/SimplifiedPlan/SimplifiedPlan';
import {TextExplain} from './components/TextExplain/TextExplain';

import './ExplainResult.scss';

const b = cn('ydb-query-explain-result');

const ExplainOptionIds = {
    schema: 'schema',
    json: 'json',
    ast: 'ast',
    simplified: 'simplified',
};

const explainOptions = [
    {value: ExplainOptionIds.schema, content: 'Schema'},
    {value: ExplainOptionIds.simplified, content: 'Explain Plan'},
    {value: ExplainOptionIds.json, content: 'JSON'},
    {value: ExplainOptionIds.ast, content: 'AST'},
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
    const [activeOption, setActiveOption] = React.useState(ExplainOptionIds.schema);
    const [isPending, startTransition] = React.useTransition();

    const isFullscreen = useTypedSelector((state) => state.fullscreen);

    React.useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, [dispatch]);

    const renderStub = () => {
        return (
            <div className={b('text-message')}>{`There is no ${activeOption} for the request`}</div>
        );
    };

    const renderContent = () => {
        if (loading || isPending) {
            return <Loader size="m" />;
        }

        if (error) {
            return <div className={b('text-message')}>{parseQueryErrorToString(error)}</div>;
        }

        switch (activeOption) {
            case ExplainOptionIds.json: {
                if (!explain?.pristine) {
                    return renderStub();
                }
                return <TextExplain explain={explain.pristine} />;
            }
            case ExplainOptionIds.ast: {
                if (!ast) {
                    return renderStub();
                }
                return <Ast ast={ast} theme={theme} />;
            }
            case ExplainOptionIds.schema: {
                if (!explain?.nodes?.length) {
                    return renderStub();
                }
                return <Graph theme={theme} explain={explain} />;
            }
            case ExplainOptionIds.simplified: {
                if (!simplifiedPlan) {
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
            {/* this is a hack: only one Graph component may be in DOM because of it's canvas id */}
            {activeOption === ExplainOptionIds.schema && isFullscreen ? null : (
                <div className={b('result')}>{renderContent()}</div>
            )}
            {isFullscreen && <Fullscreen>{renderContent()}</Fullscreen>}
        </React.Fragment>
    );
}
