import React from 'react';

import _omit from 'lodash/omit';
import JSONTree from 'react-json-inspector';
import {TreeView} from 'ydb-ui-components';

import type {IssuesTree} from '../../../../../../store/reducers/healthcheckInfo/types';
import {hcStatusToColorFlag} from '../../../../../../store/reducers/healthcheckInfo/utils';
import {cn} from '../../../../../../utils/cn';

import {IssueTreeItem} from './IssueTreeItem';

import './IssueTree.scss';

const b = cn('issue-tree');

interface IssuesViewerProps {
    issueTree: IssuesTree;
}

const IssueTree = ({issueTree}: IssuesViewerProps) => {
    const [collapsedIssues, setCollapsedIssues] = React.useState<Record<string, boolean>>({});

    const renderInfoPanel = React.useCallback((info?: object) => {
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
    }, []);

    const renderTree = React.useCallback(
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
        [collapsedIssues, renderInfoPanel],
    );

    return (
        <div className={b()}>
            <div className={b('block')}>{renderTree([issueTree])}</div>
        </div>
    );
};

export default IssueTree;
