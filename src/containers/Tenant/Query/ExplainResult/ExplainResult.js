import React from 'react';

import {getTopology, getYdbPlanNodeShape} from '@gravity-ui/paranoid';
import {Loader, RadioButton} from '@gravity-ui/uikit';
import {LANGUAGE_ID} from 'monaco-yql-languages/build/s-expressions/s-expressions';
import JSONTree from 'react-json-inspector';

import Divider from '../../../../components/Divider/Divider';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {MonacoEditor} from '../../../../components/MonacoEditor/MonacoEditor';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import {explainVersions} from '../../../../store/reducers/explainQuery/utils';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {parseQueryErrorToString} from '../../../../utils/query';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';

import {renderExplainNode} from './utils';

import './ExplainResult.scss';
import 'react-json-inspector/json-inspector.css';

const b = cn('ydb-query-explain-result');

const EDITOR_OPTIONS = {
    automaticLayout: true,
    selectOnLineNumbers: true,
    readOnly: true,
    minimap: {
        enabled: false,
    },
    wrappingIndent: 'indent',
};

const ExplainOptionIds = {
    schema: 'schema',
    json: 'json',
    ast: 'ast',
};

const explainOptions = [
    {value: ExplainOptionIds.schema, content: 'Schema'},
    {value: ExplainOptionIds.json, content: 'JSON'},
    {value: ExplainOptionIds.ast, content: 'AST'},
];

function GraphRoot(props) {
    const paranoid = React.useRef();

    const {data, opts, shapes, theme} = props;

    React.useEffect(() => {
        const graphRoot = document.getElementById('graphRoot');

        if (!graphRoot) {
            throw new Error("Can't find element with id #graphRoot");
        }

        graphRoot.innerHTML = '';

        paranoid.current = getTopology('graphRoot', data, opts, shapes);
        paranoid.current.render();
        return () => {
            paranoid.current = undefined;
        };
    }, [theme]);

    React.useEffect(() => {
        paranoid.current?.updateData?.(props.data);
    }, [props.data]);

    return <div id="graphRoot" style={{height: '100vh'}} />;
}

export function ExplainResult(props) {
    const dispatch = useTypedDispatch();
    const [activeOption, setActiveOption] = React.useState(ExplainOptionIds.schema);

    const isFullscreen = useTypedSelector((state) => state.fullscreen);

    React.useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, [dispatch]);

    const onSelectOption = (tabId) => {
        setActiveOption(tabId);
    };

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    const renderStub = () => {
        return (
            <div className={b('text-message')}>{`There is no ${activeOption} for the request`}</div>
        );
    };

    const hasContent = () => {
        switch (activeOption) {
            case ExplainOptionIds.schema:
                return Boolean(props.explain?.nodes?.length);
            case ExplainOptionIds.json:
                return Boolean(props.explain);
            case ExplainOptionIds.ast:
                return Boolean(props.ast);
            default:
                return false;
        }
    };

    const renderTextExplain = () => {
        const content = (
            <JSONTree
                data={props.explain?.pristine}
                isExpanded={() => true}
                className={b('inspector')}
                searchOptions={{
                    debounceTime: 300,
                }}
            />
        );

        return (
            <React.Fragment>
                {content}
                {isFullscreen && <Fullscreen>{content}</Fullscreen>}
            </React.Fragment>
        );
    };

    const renderAstExplain = () => {
        const content = (
            <div className={b('ast')}>
                <MonacoEditor
                    language={LANGUAGE_ID}
                    value={props.ast}
                    options={EDITOR_OPTIONS}
                    wrappingIndent="indent"
                    theme={`vs-${props.theme}`}
                />
            </div>
        );
        return (
            <React.Fragment>
                {content}
                {isFullscreen && <Fullscreen>{content}</Fullscreen>}
            </React.Fragment>
        );
    };

    const renderGraph = () => {
        const {explain = {}, theme} = props;
        const {links, nodes, version} = explain;

        const isSupportedVersion = version === explainVersions.v2;
        const isEnoughDataForGraph = links && nodes && nodes.length;

        const content =
            isSupportedVersion && isEnoughDataForGraph ? (
                <div
                    className={b('explain-canvas-container', {
                        hidden: activeOption !== ExplainOptionIds.schema,
                    })}
                >
                    <GraphRoot
                        theme={theme}
                        data={{links, nodes}}
                        opts={{
                            renderNodeTitle: renderExplainNode,
                            textOverflow: 'normal',
                            initialZoomFitsCanvas: true,
                        }}
                        shapes={{
                            node: getYdbPlanNodeShape,
                        }}
                    />
                </div>
            ) : null;
        return (
            <React.Fragment>
                {!isFullscreen && content}
                {isFullscreen && <Fullscreen>{content}</Fullscreen>}
            </React.Fragment>
        );
    };

    const renderError = () => {
        return <div className={b('text-message')}>{parseQueryErrorToString(props.error)}</div>;
    };

    const renderContent = () => {
        const {error, loading} = props;
        if (loading) {
            return renderLoader();
        }

        if (error) {
            return renderError();
        }

        if (!hasContent()) {
            return renderStub();
        }

        switch (activeOption) {
            case ExplainOptionIds.json: {
                return renderTextExplain();
            }
            case ExplainOptionIds.ast: {
                return renderAstExplain();
            }
            case ExplainOptionIds.schema: {
                return renderGraph();
            }
            default:
                return null;
        }
    };

    return (
        <React.Fragment>
            <div className={b('controls')}>
                {!props.loading && (
                    <React.Fragment>
                        <div className={b('controls-right')}>
                            <QueryExecutionStatus error={props.error} />
                            {!props.error && (
                                <React.Fragment>
                                    <Divider />
                                    <RadioButton
                                        options={explainOptions}
                                        value={activeOption}
                                        onUpdate={onSelectOption}
                                    />
                                </React.Fragment>
                            )}
                        </div>
                        <div className={b('controls-left')}>
                            <EnableFullscreenButton
                                disabled={Boolean(props.error) || !hasContent()}
                            />
                            <PaneVisibilityToggleButtons
                                onCollapse={props.onCollapseResults}
                                onExpand={props.onExpandResults}
                                isCollapsed={props.isResultsCollapsed}
                                initialDirection="bottom"
                            />
                        </div>
                    </React.Fragment>
                )}
            </div>
            <div className={b('result')}>{renderContent()}</div>
        </React.Fragment>
    );
}
