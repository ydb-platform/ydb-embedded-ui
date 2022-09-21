import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';
import {RadioButton} from '@gravity-ui/uikit';
import JSONTree from 'react-json-inspector';

import CopyToClipboard from '../../../../components/CopyToClipboard/CopyToClipboard';
import Divider from '../../../../components/Divider/Divider';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';

import './QueryResult.scss';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import QueryExecutionStatus from '../../../../components/QueryExecutionStatus/QueryExecutionStatus';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import ResultIssues from '../Issues/Issues';

const b = cn('kv-query-result');

const resultOptionsIds = {
    result: 'result',
    stats: 'stats',
};

const resultOptions = [
    {value: resultOptionsIds.result, content: 'Result'},
    {value: resultOptionsIds.stats, content: 'Stats'},
];

function QueryResult(props) {
    const [activeSection, setActiveSection] = useState(resultOptionsIds.result);
    const isFullscreen = useSelector((state) => state.fullscreen);
    const dispatch = useDispatch();

    useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, []);

    const onSelectSection = (value) => {
        setActiveSection(value);
    };

    const renderClipboardButton = () => {
        const {textResults, copyDisabled} = props;

        return (
            <CopyToClipboard
                text={textResults}
                title="Copy results"
                toastText="Results were copied to clipboard successfully"
                disabled={copyDisabled}
            />
        );
    };

    const renderStats = () => {
        const content = (
            <JSONTree
                data={props.stats}
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
                {isFullscreen && (
                    <Fullscreen>
                        <div className={b('inspector', {fullscreen: true})}>{content}</div>
                    </Fullscreen>
                )}
            </React.Fragment>
        );
    };

    const renderResult = () => {
        const {result} = props;

        return (
            <React.Fragment>
                {result}
                {isFullscreen && (
                    <Fullscreen>
                        <div className={b('result', {fullscreen: true})}>{result}</div>
                    </Fullscreen>
                )}
            </React.Fragment>
        );
    };

    const renderIssues = () => {
        const error = props.error?.data;

        const hasIssues = error?.issues && Array.isArray(error.issues);

        return hasIssues ? (
            <React.Fragment>
                <ResultIssues data={error} />
                {isFullscreen && (
                    <Fullscreen>
                        <div className={b('result', {fullscreen: true})}>
                            <ResultIssues data={error} />
                        </div>
                    </Fullscreen>
                )}
            </React.Fragment>
        ) : (
            <span>{error?.data ?? error}</span>
        );
    };

    return (
        <React.Fragment>
            <div className={b('controls')}>
                <div className={b('controls-right')}>
                    <QueryExecutionStatus hasError={Boolean(props.error)} />

                    {props.stats && !props.error && (
                        <React.Fragment>
                            <Divider />
                            <RadioButton
                                options={resultOptions}
                                value={activeSection}
                                onUpdate={onSelectSection}
                            />
                        </React.Fragment>
                    )}
                </div>
                <div className={b('controls-left')}>
                    {renderClipboardButton()}
                    <EnableFullscreenButton />
                    <PaneVisibilityToggleButtons
                        onCollapse={props.onCollapseResults}
                        onExpand={props.onExpandResults}
                        isCollapsed={props.isResultsCollapsed}
                        initialDirection="bottom"
                    />
                </div>
            </div>
            <div className={b('result')}>
                {activeSection === resultOptionsIds.result && !props.error && renderResult()}
                {activeSection === resultOptionsIds.stats && !props.error && renderStats()}
                {renderIssues()}
            </div>
        </React.Fragment>
    );
}

export default QueryResult;
