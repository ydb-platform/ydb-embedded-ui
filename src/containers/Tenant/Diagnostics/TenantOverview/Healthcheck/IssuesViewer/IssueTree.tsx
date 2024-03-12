import {useCallback, useState} from 'react';
import cn from 'bem-cn-lite';
import _omit from 'lodash/omit';

import JSONTree from 'react-json-inspector';

import {TreeView} from 'ydb-ui-components';

import {IssuesTree} from '../../../../../../store/reducers/healthcheckInfo/types';
import {hcStatusToColorFlag} from '../../../../../../store/reducers/healthcheckInfo/utils';

import {IssueTreeItem} from './IssueTreeItem';

import './IssueTree.scss';

const b = cn('issue-tree');

interface IssuesViewerProps {
    issueTree: IssuesTree;
}

const IssueTree = ({issueTree}: IssuesViewerProps) => {
    const [collapsedIssues, setCollapsedIssues] = useState<Record<string, boolean>>({});

    const renderTree = useCallback(
        (data: IssuesTree[]) => {
            return data.map((item) => {
                const {id} = item;
                const {status, message, type, reasonsItems, level, ...rest} = item;

                const isCollapsed =
                    typeof collapsedIssues[id] === 'undefined' || collapsedIssues[id];

                const toggleCollapsed = () => {
                    setCollapsedIssues((collapsedIssues) => ({
                        ...collapsedIssues,
                        [id]: !isCollapsed,
                    }));
                };

                return (
                    <TreeView
                        key={id}
                        name={
                            <IssueTreeItem
                                status={hcStatusToColorFlag[status]}
                                message={message}
                                type={type}
                            />
                        }
                        collapsed={isCollapsed}
                        hasArrow={true}
                        onClick={toggleCollapsed}
                        onArrowClick={toggleCollapsed}
                        level={level - 1}
                    >
                        {renderInfoPanel(_omit(rest, ['reason']))}
                        {renderTree(reasonsItems || [])}
                    </TreeView>
                );
            });
        },
        [issueTree, collapsedIssues],
    );

    const renderInfoPanel = useCallback(
        (info) => {
            if (!info) {
                return null;
            }

            return (
                <div className={b('info-panel')}>
                    <JSONTree
                        data={info}
                        search={false}
                        isExpanded={() => true}
                        className={b('inspector')}
                    />
                </div>
            );
        },
        [issueTree],
    );

    return (
        <div className={b()}>
            <div className={b('block')}>{renderTree([issueTree])}</div>
        </div>
    );
};

export default IssueTree;
