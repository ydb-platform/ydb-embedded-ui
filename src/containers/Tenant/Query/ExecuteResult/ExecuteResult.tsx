import React, {type ReactNode, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';
import JSONTree from 'react-json-inspector';

import {RadioButton} from '@gravity-ui/uikit';

import CopyToClipboard from '../../../../components/CopyToClipboard/CopyToClipboard';
import Divider from '../../../../components/Divider/Divider';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';

import type {ValueOf} from '../../../../types/common';
import type {IQueryResult, QueryErrorResponse} from '../../../../types/store/query';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import {prepareQueryError} from '../../../../utils/query';
import {useTypedSelector} from '../../../../utils/hooks';

import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';

import {ResultIssues} from '../Issues/Issues';
import {QueryDuration} from '../QueryDuration/QueryDuration';

import './ExecuteResult.scss';

const b = cn('ydb-query-execute-result');

const resultOptionsIds = {
    result: 'result',
    stats: 'stats',
} as const;

type SectionID = ValueOf<typeof resultOptionsIds>;

const resultOptions = [
    {value: resultOptionsIds.result, content: 'Result'},
    {value: resultOptionsIds.stats, content: 'Stats'},
];

interface ExecuteResultProps {
    textResults: string;
    result: ReactNode;
    stats: IQueryResult['stats'] | undefined;
    error: string | QueryErrorResponse | undefined;
    copyDisabled?: boolean;
    isResultsCollapsed?: boolean;
    onCollapseResults: VoidFunction;
    onExpandResults: VoidFunction;
}

export function ExecuteResult({
    textResults,
    result,
    stats,
    error,
    copyDisabled,
    isResultsCollapsed,
    onCollapseResults,
    onExpandResults,
}: ExecuteResultProps) {
    const [activeSection, setActiveSection] = useState<SectionID>(resultOptionsIds.result);
    const isFullscreen = useTypedSelector((state) => state.fullscreen);
    const dispatch = useDispatch();

    useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, [dispatch]);

    const onSelectSection = (value: string) => {
        setActiveSection(value as SectionID);
    };

    const renderClipboardButton = () => {
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
                data={stats}
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
        if (typeof error === 'object' && error?.data?.issues && Array.isArray(error.data.issues)) {
            return (
                <React.Fragment>
                    <ResultIssues data={error.data} />
                    {isFullscreen && (
                        <Fullscreen>
                            <div className={b('result', {fullscreen: true})}>
                                <ResultIssues data={error.data} />
                            </div>
                        </Fullscreen>
                    )}
                </React.Fragment>
            );
        }

        if (error) {
            const parsedError = typeof error === 'string' ? error : prepareQueryError(error);

            return <div className={b('error')}>{parsedError}</div>;
        }

        return null;
    };

    return (
        <React.Fragment>
            <div className={b('controls')}>
                <div className={b('controls-right')}>
                    <QueryExecutionStatus error={error} />

                    {stats && !error && (
                        <React.Fragment>
                            <QueryDuration duration={stats?.DurationUs} />
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
                        onCollapse={onCollapseResults}
                        onExpand={onExpandResults}
                        isCollapsed={isResultsCollapsed}
                        initialDirection="bottom"
                    />
                </div>
            </div>
            <div className={b('result')}>
                {activeSection === resultOptionsIds.result && !error && renderResult()}
                {activeSection === resultOptionsIds.stats && !error && renderStats()}
                {renderIssues()}
            </div>
        </React.Fragment>
    );
}
