import React, {useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';
import MonacoEditor from 'react-monaco-editor';
import JSONTree from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';

import {TextOverflow, getYdbPlanNodeShape, getTopology} from '@gravity-ui/paranoid';
import {Loader, RadioButton} from '@gravity-ui/uikit';

import Divider from '../../../../components/Divider/Divider';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';

import {explainVersions} from '../../../../store/reducers/explainQuery';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';

import {renderExplainNode} from '../../../../utils';
import {LANGUAGE_S_EXPRESSION_ID} from '../../../../utils/monaco';

import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';

import './ExplainResult.scss';

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
    const paranoid = useRef();

    const {data, opts, shapes, theme} = props;

    const [componentTheme, updateComponentTheme] = useState(theme);

    useEffect(() => {
        updateComponentTheme(theme);
    }, [theme]);

    const render = () => {
        paranoid.current = getTopology('graphRoot', data, opts, shapes);
        paranoid.current.render();
    };

    useEffect(() => {
        render();

        return () => {
            paranoid.current = undefined;
        };
    }, []);

    useEffect(() => {
        const graphRoot = document.getElementById('graphRoot');

        if (!graphRoot) {
            throw new Error("Can't find element with id #graphRoot");
        }

        graphRoot.innerHTML = '';

        render();
    }, [componentTheme]);

    useEffect(() => {
        paranoid.current?.updateData?.(props.data);
    }, [props.data]);

    return <div id="graphRoot" style={{height: '100vh'}} />;
}

export function ExplainResult(props) {
    const dispatch = useDispatch();
    const [activeOption, setActiveOption] = useState(ExplainOptionIds.schema);

    const isFullscreen = useSelector((state) => state.fullscreen);

    useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, []);

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
                    language={LANGUAGE_S_EXPRESSION_ID}
                    value={props.ast}
                    options={EDITOR_OPTIONS}
                    wrappingIndent="indent"
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
                            textOverflow: TextOverflow.Normal,
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
        const {error} = props;

        let message;

        if (error.data) {
            message = typeof error.data === 'string' ? error.data : error.data.error?.message;
        } else {
            message = error;
        }

        return <div className={b('text-message')}>{message}</div>;
    };

    const renderContent = () => {
        const {error, loading, loadingAst} = props;
        if (loading || loadingAst) {
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
