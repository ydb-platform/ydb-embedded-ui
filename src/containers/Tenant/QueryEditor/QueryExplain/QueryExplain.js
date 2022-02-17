import React, {useEffect, useState, useMemo} from 'react';
import cn from 'bem-cn-lite';
import MonacoEditor from 'react-monaco-editor';
import {Loader, Tabs} from '@yandex-cloud/uikit';
import JSONTree from 'react-json-inspector';
import {LANGUAGE_S_EXPRESSION_ID} from '../../../../utils/monaco';

import './QueryExplain.scss';
import {
    TopologyWrapper,
    CompactTopologyWrapper,
    TextOverflow,
    getYdbPlanNodeShape,
} from '@yandex-cloud/paranoid';
import {renderExplainNode} from '../../../../utils';
import {explainVersions} from '../../../../store/reducers/explainQuery';

const b = cn('kv-query-explain');

const DARK_COLORS = {
    success: 'rgba(59,201,53,0.75)',
    error: '#bf3230',
    warning: '#cc6810',
    mute: 'rgba(255,255,255,0.15)',
    stroke: 'rgba(255,255,255,0.17)',
    fill: '#313037',
    nodeFill: '#3b3a41',
    nodeShadow: 'rgba(0,0,0,0.2)',
    titleColor: 'rgba(255,255,255,0.7)',
    textColor: 'rgba(255,255,255,0.55)',
    buttonBorderColor: 'rgba(255,255,255,0.07)',
};

const EDITOR_OPTIONS = {
    automaticLayout: true,
    selectOnLineNumbers: true,
    readOnly: true,
    minimap: {
        enabled: false,
    },
    wrappingIndent: 'indent',
};

const TabsIds = {
    schema: 'schema',
    json: 'json',
    ast: 'ast',
};

const tabsItems = [
    {id: TabsIds.schema, title: 'Schema'},
    {id: TabsIds.json, title: 'JSON'},
    {id: TabsIds.ast, title: 'AST'},
];

function QueryExplain(props) {
    const [activeTab, setActiveTab] = useState(TabsIds.schema);

    const {explain = {}, theme} = props;
    const {links, nodes, version, graphDepth} = explain;

    const graph = useMemo(() => {
        if (links && nodes) {
            if (version === explainVersions.v2) {
                return (
                    <TopologyWrapper
                        data={{links, nodes}}
                        opts={{
                            renderNodeTitle: renderExplainNode,
                            textOverflow: TextOverflow.Normal,
                            colors: theme === 'dark' ? DARK_COLORS : {},
                            initialZoomFitsCanvas: true,
                        }}
                        shapes={{
                            node: getYdbPlanNodeShape,
                        }}
                    />
                );
            } else if (version === explainVersions.v1) {
                return (
                    <CompactTopologyWrapper
                        data={{links, nodes}}
                        opts={{
                            renderNodeTitle: renderExplainNode,
                            textOverflow: TextOverflow.Normal,
                            colors: theme === 'dark' ? DARK_COLORS : {},
                            initialZoomFitsCanvas: true,
                        }}
                    />
                );
            }
            return 'The explanation format of the query is not supported';
        }
        return null;
    }, [links, nodes, theme, version]);

    useEffect(() => {
        if (!props.ast && activeTab === TabsIds.ast) {
            props.astQuery();
        }
    }, [activeTab]);

    const onSelectTab = (tabId) => {
        setActiveTab(tabId);
    };

    const renderTextExplain = () => {
        return (
            <JSONTree
                data={props.explain?.pristine}
                isExpanded={() => true}
                className={b('inspector')}
                searchOptions={{
                    debounceTime: 300,
                }}
            />
        );
    };

    const renderAstExplain = () => {
        return props.loadingAst ? (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        ) : (
            <div className={b('ast')}>
                <MonacoEditor
                    language={LANGUAGE_S_EXPRESSION_ID}
                    value={props.ast}
                    options={EDITOR_OPTIONS}
                    wrappingIndent="indent"
                />
            </div>
        );
    };

    const renderGraph = () => {
        const graphHeight = `${Math.max(graphDepth * 100, 200)}px`;
        return (
            <div
                className={b('explain-canvas-container', {
                    hidden: activeTab !== TabsIds.schema,
                })}
                style={{height: graphHeight, minHeight: graphHeight}}
            >
                {graph}
            </div>
        );
    };

    return (
        <React.Fragment>
            <div className={b('tabs-wrapper')}>
                <Tabs
                    items={tabsItems}
                    onSelectTab={onSelectTab}
                    activeTab={activeTab}
                    className={b('tabs')}
                />
            </div>
            {activeTab === TabsIds.json && renderTextExplain()}
            {activeTab === TabsIds.ast && renderAstExplain()}
            {activeTab === TabsIds.schema && renderGraph()}
        </React.Fragment>
    );
}

export default QueryExplain;
