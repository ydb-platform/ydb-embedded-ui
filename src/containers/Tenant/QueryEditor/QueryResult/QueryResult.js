import React, {useState} from 'react';
import cn from 'bem-cn-lite';
import {Tabs} from '@yandex-cloud/uikit';
import JSONTree from 'react-json-inspector';

import './QueryResult.scss';

const b = cn('kv-query-result');

const TabsIds = {
    result: 'result',
    stats: 'stats',
};

const tabsItems = [
    {id: TabsIds.result, title: 'Result'},
    {id: TabsIds.stats, title: 'Stats'},
];

function QueryResult(props) {
    const [activeTab, setActiveTab] = useState(TabsIds.result);

    const onSelectTab = (tabId) => {
        setActiveTab(tabId);
    };

    const renderStats = () => {
        return (
            <JSONTree
                data={props.stats}
                isExpanded={() => true}
                className={b('inspector')}
                searchOptions={{
                    debounceTime: 300,
                }}
            />
        );
    };

    return (
        <React.Fragment>
            {props.stats && (
                <Tabs
                    items={tabsItems}
                    onSelectTab={onSelectTab}
                    activeTab={activeTab}
                    className={b('tabs')}
                />
            )}
            <div className={b('result')}>
                {activeTab === TabsIds.result && props.result}
                {activeTab === TabsIds.stats && renderStats()}
            </div>
        </React.Fragment>
    );
}

export default QueryResult;
