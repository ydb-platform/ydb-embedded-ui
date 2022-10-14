import {useCallback, useState} from 'react';
import cn from 'bem-cn-lite';
import JSONTree from 'react-json-inspector';
import _ from 'lodash';

import {TreeView} from 'ydb-ui-components';

import EntityStatus from '../../../../../components/EntityStatus/EntityStatus';

import './IssueViewer.scss';

const issueBlock = cn('issue');

const IssueRow = ({data, onClick}) => {
    const {status, message, type} = data;

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

const IssuesViewer = ({issue}) => {
    const [collapsedIssues, setCollapsedIssues] = useState({});

    const renderTree = useCallback(
        (data, childrenKey) => {
            return _.map(data, (item) => {
                const {id} = item;

                // eslint-disable-next-line no-unused-vars
                const {status, message, type, reasonsItems, reason, level, ...rest} = item;

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
                        name={<IssueRow data={item} />}
                        collapsed={isCollapsed}
                        hasArrow={true}
                        onClick={toggleCollapsed}
                        onArrowClick={toggleCollapsed}
                        level={level - 1}
                    >
                        {renderInfoPanel(rest)}
                        {renderTree(item[childrenKey], childrenKey)}
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
            <div className={issueViewerBlock('tree')}>{renderTree([issue], 'reasonsItems')}</div>
        </div>
    );
};

export default IssuesViewer;
