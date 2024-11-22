import {Tabs, Text} from '@gravity-ui/uikit';

import {QueryResultTable} from '../../../../../../components/QueryResultTable';
import type {ParsedResultSet} from '../../../../../../types/store/query';
import {getArray} from '../../../../../../utils';
import {cn} from '../../../../../../utils/cn';
import i18n from '../../i18n';

import './ResultSetsViewer.scss';

const b = cn('ydb-query-result-sets-viewer');

interface ResultSetsViewerProps {
    resultSets?: ParsedResultSet[];
    selectedResultSet: number;
    setSelectedResultSet: (resultSet: number) => void;
}

export function ResultSetsViewer({
    resultSets,
    selectedResultSet,
    setSelectedResultSet,
}: ResultSetsViewerProps) {
    const resultsSetsCount = resultSets?.length || 0;
    const currentResult = resultSets?.[selectedResultSet];

    const renderTabs = () => {
        if (resultsSetsCount > 1) {
            const tabsItems = getArray(resultsSetsCount).map((item) => ({
                id: String(item),
                title: `Result #${item + 1}${resultSets?.[item]?.truncated ? ' (T)' : ''}`,
            }));

            return (
                <div>
                    <Tabs
                        className={b('tabs')}
                        size="l"
                        items={tabsItems}
                        activeTab={String(selectedResultSet)}
                        onSelectTab={(tabId) => setSelectedResultSet(Number(tabId))}
                    />
                </div>
            );
        }

        return null;
    };

    const renderResultHeadWithCount = () => {
        return (
            <div className={b('head')}>
                <Text variant="subheader-3">
                    {currentResult?.truncated ? i18n('title.truncated') : i18n('title.result')}
                </Text>
                {currentResult?.result ? (
                    <Text
                        color="secondary"
                        variant="body-2"
                        className={b('row-count')}
                    >{`(${currentResult?.result.length})`}</Text>
                ) : null}
            </div>
        );
    };

    return (
        <div className={b('result-wrapper')}>
            {renderTabs()}
            {currentResult ? (
                <div className={b('result')}>
                    {renderResultHeadWithCount()}
                    <QueryResultTable data={currentResult.result} columns={currentResult.columns} />
                </div>
            ) : null}
        </div>
    );
}
