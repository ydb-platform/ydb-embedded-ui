import React from 'react';

import {ClipboardButton, RadioButton} from '@gravity-ui/uikit';

import Divider from '../../../../components/Divider/Divider';
import ElapsedTime from '../../../../components/ElapsedTime/ElapsedTime';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import type {QueryResult} from '../../../../store/reducers/query/types';
import type {ValueOf} from '../../../../types/common';
import {cn} from '../../../../utils/cn';
import {getStringifiedData} from '../../../../utils/dataFormatters/dataFormatters';
import {useTypedDispatch} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import {CancelQueryButton} from '../CancelQueryButton/CancelQueryButton';
import {QueryDuration} from '../QueryDuration/QueryDuration';
import {QuerySettingsBanner} from '../QuerySettingsBanner/QuerySettingsBanner';
import {isQueryCancelledError} from '../utils/isQueryCancelledError';

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
    result: QueryResult;
    tenantName: string;
    isResultsCollapsed?: boolean;
    onCollapseResults: VoidFunction;
    onExpandResults: VoidFunction;
}

export function ExplainResult({
    theme,
    result,
    tenantName,
    onCollapseResults,
    onExpandResults,
    isResultsCollapsed,
}: ExplainResultProps) {
    const dispatch = useTypedDispatch();
    const [activeOption, setActiveOption] = React.useState<QueryExplainTab>(
        EXPLAIN_OPTIONS_IDS.schema,
    );
    const [isPending, startTransition] = React.useTransition();
    const {error, isLoading, queryId} = result;

    const {preparedPlan: explain, ast, simplifiedPlan} = result.data || {};

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
        if (isQueryCancelledError(error)) {
            return null;
        }

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
                const {plan} = simplifiedPlan ?? {};
                if (!plan?.length) {
                    return renderStub();
                }
                return <SimplifiedPlan plan={plan} />;
            }
            default:
                return null;
        }
    };

    const getStatsToCopy = () => {
        switch (activeOption) {
            case EXPLAIN_OPTIONS_IDS.json:
                return explain?.pristine;
            case EXPLAIN_OPTIONS_IDS.ast:
                return ast;
            case EXPLAIN_OPTIONS_IDS.simplified:
                return simplifiedPlan?.pristine;
            default:
                return undefined;
        }
    };

    const statsToCopy = getStatsToCopy();
    const copyText = getStringifiedData(statsToCopy);

    return (
        <React.Fragment>
            <div className={b('controls')}>
                <div className={b('controls-right')}>
                    <QueryExecutionStatus error={error} loading={isLoading} />

                    {!error && !isLoading && (
                        <React.Fragment>
                            {explain?.DurationUs !== undefined && (
                                <QueryDuration duration={explain.DurationUs} />
                            )}
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
                        </React.Fragment>
                    )}
                    {isLoading ? (
                        <React.Fragment>
                            <ElapsedTime className={b('elapsed-time')} />
                            <CancelQueryButton queryId={queryId} tenantName={tenantName} />
                        </React.Fragment>
                    ) : null}
                </div>
                <div className={b('controls-left')}>
                    {copyText && (
                        <ClipboardButton
                            text={copyText}
                            view="flat-secondary"
                            title={i18n('action.copy', {activeOption})}
                        />
                    )}
                    <EnableFullscreenButton disabled={Boolean(error)} />
                    <PaneVisibilityToggleButtons
                        onCollapse={onCollapseResults}
                        onExpand={onExpandResults}
                        isCollapsed={isResultsCollapsed}
                        initialDirection="bottom"
                    />
                </div>
            </div>
            {isLoading || isQueryCancelledError(error) ? null : <QuerySettingsBanner />}
            <LoaderWrapper loading={isLoading || isPending}>
                <Fullscreen className={b('result')}>{renderContent()}</Fullscreen>
            </LoaderWrapper>
        </React.Fragment>
    );
}
