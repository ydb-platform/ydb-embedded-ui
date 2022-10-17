import {useCallback, useState} from 'react';
import cn from 'bem-cn-lite';
import _ from 'lodash';

// @ts-ignore
import JSONTree from 'react-json-inspector';

import {TreeView} from 'ydb-ui-components';

import {IIssuesTree} from '../../../../../types/store/healthcheck';
import EntityStatus from '../../../../../components/EntityStatus/EntityStatus';

import './IssueViewer.scss';

const issueBlock = cn('issue');

interface IssueRowProps {
    status: string;
    message: string;
    type: string;
    onClick?: VoidFunction;
}

const IssueRow = ({status, message, type, onClick}: IssueRowProps) => {
    return (
        <div className={issueBlock()} onClick={onClick}>
            <div className={issueBlock('field', {status: true})}>
                <EntityStatus mode="icons" status={status} name={type} />
            </div>
            <div className={issueBlock('field', {message: true})}>{message}</div>
        </div>
    );
};

const issueViewerBlock = cn('issue-viewer');

interface IssuesViewerProps {
    issue: IIssuesTree;
}

const IssuesViewer = ({issue}: IssuesViewerProps) => {
    const [collapsedIssues, setCollapsedIssues] = useState<Record<string, boolean>>({});

    const renderTree = useCallback(
        (data) => {
            return _.map(data, (item) => {
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
                        name={<IssueRow status={status} message={message} type={type} />}
                        collapsed={isCollapsed}
                        hasArrow={true}
                        onClick={toggleCollapsed}
                        onArrowClick={toggleCollapsed}
                        level={level - 1}
                    >
                        {renderInfoPanel(_.omit(rest, ['reason']))}
                        {renderTree(reasonsItems)}
                    </TreeView>
                );
            });
        },
        [issue, collapsedIssues],
    );

    const renderInfoPanel = useCallback(
        (info) => {
            if (!info) {
                return null;
            }

            return (
                <div className={issueViewerBlock('info-panel')}>
                    <JSONTree
                        data={info}
                        search={false}
                        isExpanded={() => true}
                        className={issueViewerBlock('inspector')}
                    />
                </div>
            );
        },
        [issue],
    );

    return (
        <div className={issueViewerBlock()}>
            <div className={issueViewerBlock('tree')}>{renderTree([issue])}</div>
        </div>
    );
};

export default IssuesViewer;
