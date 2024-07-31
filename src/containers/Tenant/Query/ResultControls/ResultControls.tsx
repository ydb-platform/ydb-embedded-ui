import React from 'react';

import type {ControlGroupOption} from '@gravity-ui/uikit';
import {RadioButton} from '@gravity-ui/uikit';

import {ClipboardButton} from '../../../../components/ClipboardButton';
import Divider from '../../../../components/Divider/Divider';
import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import {QueryExecutionStatus} from '../../../../components/QueryExecutionStatus';
import {cn} from '../../../../utils/cn';
import {PaneVisibilityToggleButtons} from '../../utils/paneVisibilityToggleHelpers';
import {QueryDuration} from '../QueryDuration/QueryDuration';

import './ResultControls.scss';

const b = cn('ydb-query-result-controls');

interface Stats {
    DurationUs?: string | number;
    // Add other stats properties as needed
}

interface ResultControlsProps<T extends string> {
    error: unknown;
    stats?: Stats;
    activeSection?: T;
    loading?: boolean;
    onSelectSection?: (value: T) => void;
    sectionOptions?: ControlGroupOption<T>[];
    clipboardText?: string;
    isClipboardDisabled?: boolean;
    isResultsCollapsed?: boolean;
    onCollapseResults: VoidFunction;
    onExpandResults: VoidFunction;
    isFullscreenDisabled?: boolean;
}

export function ResultControls<T extends string>({
    error,
    stats,
    activeSection,
    loading,
    onSelectSection,
    sectionOptions,
    clipboardText,
    isClipboardDisabled,
    isResultsCollapsed,
    onCollapseResults,
    onExpandResults,
    isFullscreenDisabled,
}: ResultControlsProps<T>) {
    return (
        <div className={b('controls')}>
            <div className={b('controls-right')}>
                <QueryExecutionStatus error={error} loading={loading} />

                {!error && !loading && (
                    <React.Fragment>
                        {stats?.DurationUs !== undefined && (
                            <QueryDuration duration={Number(stats.DurationUs)} />
                        )}
                        {sectionOptions && activeSection && onSelectSection && (
                            <React.Fragment>
                                <Divider />
                                <RadioButton
                                    options={sectionOptions}
                                    value={activeSection}
                                    onUpdate={onSelectSection}
                                />
                            </React.Fragment>
                        )}
                    </React.Fragment>
                )}
            </div>
            <div className={b('controls-left')}>
                {clipboardText !== undefined && (
                    <ClipboardButton
                        text={clipboardText}
                        view="flat-secondary"
                        title="Copy results"
                        disabled={isClipboardDisabled}
                    />
                )}
                <EnableFullscreenButton disabled={isFullscreenDisabled} />
                <PaneVisibilityToggleButtons
                    onCollapse={onCollapseResults}
                    onExpand={onExpandResults}
                    isCollapsed={isResultsCollapsed}
                    initialDirection="bottom"
                />
            </div>
        </div>
    );
}
