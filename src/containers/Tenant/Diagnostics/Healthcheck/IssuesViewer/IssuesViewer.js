import {useCallback, useEffect, useState} from 'react';
import cn from 'bem-cn-lite';
import JSONTree from 'react-json-inspector';
import _ from 'lodash';
import _flow from 'lodash/fp/flow';
import _filter from 'lodash/fp/filter';
import _sortBy from 'lodash/fp/sortBy';
import _uniqBy from 'lodash/fp/uniqBy';

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

const IssuesViewer = ({issues, expandedIssueId}) => {
    const [data, setData] = useState([]);
    const [collapsedIssues, setCollapsedIssues] = useState({});

    useEffect(() => {
        const newData = getInvertedConsequencesTree({data: issues});

        setData(newData);
    }, [issues]);

    const renderTree = useCallback(
        (data, childrenKey) => {
            return _.map(data, (item) => {
                const {id} = item;

                // eslint-disable-next-line no-unused-vars
                const {status, message, type, reasonsItems, reason, level, ...rest} = item;

                if (level === 1 && expandedIssueId && id !== expandedIssueId) {
                    return;
                }

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
        [data, collapsedIssues],
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
        [data],
    );

    return (
        <div className={issueViewerBlock()}>
            <div className={issueViewerBlock('tree')}>{renderTree(data, 'reasonsItems')}</div>
        </div>
    );
};

function getReasonsForIssue({issue, data}) {
    return _.filter(data, (item) => issue.reason && issue.reason.indexOf(item.id) !== -1);
}

const mapStatusToPriority = {
    RED: 0,
    ORANGE: 1,
    YELLOW: 2,
    BLUE: 3,
    GREEN: 4,
};

function getInvertedConsequencesTree({data, roots: receivedRoots}) {
    let roots = receivedRoots;
    if (!roots && data) {
        roots = _flow([
            _filter((item) => {
                return !_.find(
                    data,
                    (issue) => issue.reason && issue.reason.indexOf(item.id) !== -1,
                );
            }),
            _uniqBy((item) => item.id),
            _sortBy(({status}) => mapStatusToPriority[status]),
        ])(data);
    }

    return _.map(roots, (issue) => {
        const reasonsItems = getInvertedConsequencesTree({
            roots: getReasonsForIssue({issue, data}),
            data,
        });

        return {
            ...issue,
            reasonsItems,
        };
    });
}

export default IssuesViewer;
