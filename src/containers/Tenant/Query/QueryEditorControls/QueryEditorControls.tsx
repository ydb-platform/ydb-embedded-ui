import React from 'react';

import {cancelQueryApi} from '../../../../store/reducers/cancelQuery';
import {selectUserInput} from '../../../../store/reducers/query/query';
import type {QueryAction} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import createToast from '../../../../utils/createToast';
import {useTypedSelector} from '../../../../utils/hooks';
import {NewSQL} from '../NewSQL/NewSQL';
import {queryManagerInstance} from '../QueryEditor/helpers';
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
    database: string;
    isStreamingEnabled?: boolean;

    handleGetExplainQueryClick: (text: string) => void;
    handleSendExecuteClick: (text: string) => void;
    onSettingsButtonClick: () => void;
}

const STOP_APPEAR_TIMEOUT = 400;
const STOP_AUTO_HIDE_TIMEOUT = 5000;

interface ActionButtonProps {
    type: 'run' | 'explain';
    isHighlighted: boolean;
    isLoading: boolean;
    isStoppable: boolean;
    controlsDisabled: boolean;
    onActionClick: () => void;
    renderStopButton: () => React.ReactNode;
}

const ActionButton = ({
    type,
    isHighlighted,
    isLoading,
    isStoppable,
    controlsDisabled,
    onActionClick,
    renderStopButton,
}: ActionButtonProps) => {
    if (isStoppable && isLoading && isHighlighted) {
        return renderStopButton();
    }

    const ButtonComponent = type === 'run' ? EditorButton.Run : EditorButton.Explain;

    return (
        <ButtonComponent
            onClick={onActionClick}
            disabled={controlsDisabled}
            loading={isLoading}
            view={isHighlighted ? 'action' : undefined}
        />
    );
};

const CANCEL_ERROR_ANIMATION_DURATION = 500;

export const QueryEditorControls = ({
    disabled,
    isLoading,
    highlightedAction,
    queryId,
    database,
    isStreamingEnabled,

    handleSendExecuteClick,
    onSettingsButtonClick,
    handleGetExplainQueryClick,
}: QueryEditorControlsProps) => {
    const input = useTypedSelector(selectUserInput);
    const [sendCancelQuery, cancelQueryResponse] = cancelQueryApi.useCancelQueryMutation();
    const [isStoppable, setIsStoppable] = React.useState(isLoading);
    const stopButtonAppearRef = React.useRef<number | null>(null);
    const cancelErrorAnimationRef = React.useRef<number | null>(null);
    const [cancelQueryError, setCancelQueryError] = React.useState<boolean>(false);

    const onStopButtonClick = React.useCallback(async () => {
        try {
            if (isStreamingEnabled) {
                queryManagerInstance.abortQuery();
            } else if (queryId) {
                await sendCancelQuery({queryId, database}).unwrap();
            }
        } catch {
            createToast({
                name: 'stop-error',
                title: '',
                content: i18n('toaster.stop-error'),
                theme: 'danger',
                autoHiding: STOP_AUTO_HIDE_TIMEOUT,
            });
            setCancelQueryError(true);

            if (cancelErrorAnimationRef.current) {
                window.clearTimeout(cancelErrorAnimationRef.current);
            }
            cancelErrorAnimationRef.current = window.setTimeout(() => {
                setCancelQueryError(false);
            }, CANCEL_ERROR_ANIMATION_DURATION);
        }
    }, [isStreamingEnabled, queryId, sendCancelQuery, database]);

    const isRunHighlighted = highlightedAction === 'execute';
    const isExplainHighlighted = highlightedAction === 'explain';

    const runSetStoppableTimeout = React.useCallback(() => {
        if (stopButtonAppearRef.current) {
            window.clearTimeout(stopButtonAppearRef.current);
        }

        setIsStoppable(false);
        stopButtonAppearRef.current = window.setTimeout(() => {
            setIsStoppable(true);
        }, STOP_APPEAR_TIMEOUT);
    }, []);

    const onRunButtonClick = React.useCallback(() => {
        handleSendExecuteClick(input);
        runSetStoppableTimeout();
    }, [handleSendExecuteClick, input, runSetStoppableTimeout]);

    const onExplainButtonClick = React.useCallback(() => {
        handleGetExplainQueryClick(input);
        runSetStoppableTimeout();
    }, [handleGetExplainQueryClick, input, runSetStoppableTimeout]);

    React.useEffect(() => {
        return () => {
            if (stopButtonAppearRef.current) {
                window.clearTimeout(stopButtonAppearRef.current);
            }

            if (cancelErrorAnimationRef.current) {
                window.clearTimeout(cancelErrorAnimationRef.current);
            }
        };
    }, []);

    const controlsDisabled = disabled || !input;

    const renderStopButton = () => (
        <EditorButton.Stop
            loading={cancelQueryResponse.isLoading}
            error={cancelQueryError}
            onClick={onStopButtonClick}
            view="action"
        />
    );

    return (
        <div className={b()}>
            <div className={b('left')}>
                <ActionButton
                    type="run"
                    isHighlighted={isRunHighlighted}
                    isLoading={isLoading}
                    isStoppable={isStoppable}
                    controlsDisabled={controlsDisabled}
                    onActionClick={onRunButtonClick}
                    renderStopButton={renderStopButton}
                />
                <ActionButton
                    type="explain"
                    isHighlighted={isExplainHighlighted}
                    isLoading={isLoading}
                    isStoppable={isStoppable}
                    controlsDisabled={controlsDisabled}
                    onActionClick={onExplainButtonClick}
                    renderStopButton={renderStopButton}
                />
                <EditorButton.Settings onClick={onSettingsButtonClick} isLoading={isLoading} />
            </div>
            <div className={b('right')}>
                <NewSQL />
                <SaveQuery buttonProps={{disabled}} />
            </div>
        </div>
    );
};
