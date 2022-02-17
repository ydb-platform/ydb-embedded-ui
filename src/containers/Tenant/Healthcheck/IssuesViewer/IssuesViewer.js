import {useCallback, useEffect, useState} from 'react';
import cn from 'bem-cn-lite';
import JSONTree from 'react-json-inspector';
import _ from 'lodash';
import _flow from 'lodash/fp/flow';
import _filter from 'lodash/fp/filter';
import _sortBy from 'lodash/fp/sortBy';
import _uniqBy from 'lodash/fp/uniqBy';

import TreeView from '../../../../components/TreeView/TreeView';
import EntityStatus from '../../../../components/EntityStatus/EntityStatus';

import './IssueViewer.scss';

// const indicatorBlock = cn('indicator');

// const IssueStatus = ({status, name}) => {
//     const modifier = status && status.toLowerCase();

//     return (
//         <React.Fragment>
//             <div className={indicatorBlock({[modifier]: true})} />
//             {name}
//         </React.Fragment>
//     );
// };

const issueBlock = cn('issue');

const IssueRow = ({data, treeLevel, active, setInfoForActive, onClick}) => {
    // eslint-disable-next-line no-unused-vars
    const {id, status, message, type, ...rest} = data;

    useEffect(() => {
        if (active) {
            setInfoForActive(rest);
        }
    }, [active, setInfoForActive]);

    return (
        <div className={issueBlock({active})} onClick={onClick}>
            <div className={issueBlock('field', {status: true})}>
                <EntityStatus status={status} name={id} />
                {/* <IssueStatus status={status} name={id} /> */}
            </div>
            <div
                className={issueBlock('field', {message: true})}
                style={{marginLeft: -treeLevel * 25 + 'px'}}
            >
                {message}
            </div>
            <div className={issueBlock('field', {type: true})}>{type}</div>
        </div>
    );
};

const issueViewerBlock = cn('issue-viewer');

const IssuesViewer = ({issues}) => {
    const [data, setData] = useState([]);
    const [collapsedIssues, setCollapsedIssues] = useState({});
    const [activeItem, setActiveItem] = useState();
    const [infoData, setInfoData] = useState();

    useEffect(() => {
        if (!activeItem && data.length) {
            const {id} = data[0];
            setActiveItem(id);
        }
    }, [data]);

    useEffect(() => {
        const newData = getInvertedConsequencesTree({data: issues});

        setData(newData);
    }, [issues]);

    const renderTree = useCallback(
        (data, childrenKey, treeLevel = 0) => {
            return _.map(data, (item) => {
                const {id} = item;
                const isActive = activeItem === item.id;
                const hasArrow = item[childrenKey].length;

                return (
                    <TreeView
                        key={id}
                        nodeLabel={
                            <IssueRow
                                data={item}
                                treeLevel={treeLevel}
                                active={isActive}
                                setInfoForActive={setInfoData}
                                onClick={() => setActiveItem(id)}
                            />
                        }
                        className={issueBlock('wpapper', {active: isActive})}
                        collapsed={
                            typeof collapsedIssues[id] === 'undefined' || collapsedIssues[id]
                        }
                        hasArrow={hasArrow}
                        onClick={() => {
                            const newValue =
                                typeof collapsedIssues[id] === 'undefined'
                                    ? false
                                    : !collapsedIssues[id];
                            const newCollapsedIssues = {...collapsedIssues, [id]: newValue};
                            setCollapsedIssues(newCollapsedIssues);
                        }}
                    >
                        {renderTree(item[childrenKey], childrenKey, treeLevel + 1)}
                    </TreeView>
                );
            });
        },
        [data, collapsedIssues, activeItem],
    );

    const renderInfoPanel = useCallback(() => {
        if (!infoData) {
            return null;
        }

        return (
            <div className={issueViewerBlock('info-panel')}>
                <h3>Additional info for {activeItem}</h3>
                <JSONTree
                    data={infoData}
                    search={false}
                    isExpanded={() => true}
                    className={issueViewerBlock('inspector')}
                />
            </div>
        );
    }, [data, infoData, activeItem]);

    return (
        <div className={issueViewerBlock()}>
            <div className={issueViewerBlock('tree')}>{renderTree(data, 'reasonsItems')}</div>
            {renderInfoPanel()}
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
