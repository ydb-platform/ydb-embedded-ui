import React from 'react';

import {cancelQueryApi} from '../../../../store/reducers/cancelQuery';
import {selectUserInput} from '../../../../store/reducers/query/query';
import type {QueryAction} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import createToast from '../../../../utils/createToast';
import {useTypedSelector} from '../../../../utils/hooks';
import {NewSQL} from '../NewSQL/NewSQL';
import {SaveQuery} from '../SaveQuery/SaveQuery';
import i18n from '../i18n';

import {EditorButton} from './EditorButton';

import './QueryEditorControls.scss';

const b = cn('ydb-query-editor-controls');

interface QueryEditorControlsProps {
    isLoading: boolean;
    disabled?: boolean;
    highlightedAction: QueryAction;
    queryId?: string;
    tenantName: string;
    isStreamingEnabled?: boolean;
    runningQueryRef: React.MutableRefObject<{abort: VoidFunction} | null>;

    handleGetExplainQueryClick: (text: string) => void;
    handleSendExecuteClick: (text: string) => void;
    onSettingsButtonClick: () => void;
}

const STOP_APPEAR_TIMEOUT = 400;
const STOP_AUTO_HIDE_TIMEOUT = 5000;

export const QueryEditorControls = ({
    disabled,
    isLoading,
    highlightedAction,
    queryId,
    tenantName,
    isStreamingEnabled,
    runningQueryRef,

    handleSendExecuteClick,
    onSettingsButtonClick,
    handleGetExplainQueryClick,
}: QueryEditorControlsProps) => {
    const input = useTypedSelector(selectUserInput);
    const [sendCancelQuery, cancelQueryResponse] = cancelQueryApi.useCancelQueryMutation();
    const stopButtonAppearRef = React.useRef<number>(0);
    const [isStopButtonVisibilityTimeoutPassed, setIsStopButtonVisibilityTimeoutPassed] =
        React.useState(false);

    React.useEffect(() => {
        if (isLoading) {
            stopButtonAppearRef.current = window.setTimeout(() => {
                setIsStopButtonVisibilityTimeoutPassed(true);
            }, STOP_APPEAR_TIMEOUT);
        } else {
            window.clearTimeout(stopButtonAppearRef.current);
            setIsStopButtonVisibilityTimeoutPassed(false);
            cancelQueryResponse.reset();
        }

        return () => {
            window.clearTimeout(stopButtonAppearRef.current);
        };
    }, [cancelQueryResponse, isLoading]);

    const onStopButtonClick = React.useCallback(async () => {
        if (queryId) {
            try {
                if (isStreamingEnabled && runningQueryRef.current) {
                    runningQueryRef.current.abort();
                } else if (queryId) {
                    sendCancelQuery({queryId, database: tenantName}).unwrap();
                }
            } catch {
                createToast({
                    name: 'stop-error',
                    title: '',
                    content: i18n('toaster.stop-error'),
                    type: 'error',
                    autoHiding: STOP_AUTO_HIDE_TIMEOUT,
                });
            }
        }
    }, [isStreamingEnabled, queryId, runningQueryRef, sendCancelQuery, tenantName]);

    const isRunHighlighted = highlightedAction === 'execute';
    const isExplainHighlighted = highlightedAction === 'explain';

    const onRunButtonClick = () => {
        handleSendExecuteClick(input);
    };

    const onExplainButtonClick = () => {
        handleGetExplainQueryClick(input);
    };

    const controlsDisabled = disabled || !input;

    const renderStopButton = () => (
        <EditorButton.Stop
            loading={cancelQueryResponse.isLoading}
            error={Boolean(cancelQueryResponse.error)}
            onClick={onStopButtonClick}
        />
    );

    return (
        <div className={b()}>
            <div className={b('left')}>
                {isStopButtonVisibilityTimeoutPassed && isLoading && isRunHighlighted ? (
                    renderStopButton()
                ) : (
                    <EditorButton.Run
                        onClick={onRunButtonClick}
                        disabled={controlsDisabled}
                        loading={isLoading}
                        view={isRunHighlighted ? 'action' : undefined}
                    />
                )}

                {isStopButtonVisibilityTimeoutPassed && isLoading && isExplainHighlighted ? (
                    renderStopButton()
                ) : (
                    <EditorButton.Explain
                        onClick={onExplainButtonClick}
                        disabled={controlsDisabled}
                        loading={isLoading}
                        view={isExplainHighlighted ? 'action' : undefined}
                    />
                )}

                <EditorButton.Settings onClick={onSettingsButtonClick} isLoading={isLoading} />
            </div>
            <div className={b('right')}>
                <NewSQL />
                <SaveQuery buttonProps={{disabled}} />
            </div>
        </div>
    );
};
