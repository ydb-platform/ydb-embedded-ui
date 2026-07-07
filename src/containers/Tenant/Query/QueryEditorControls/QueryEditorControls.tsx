import React from 'react';

import {ChevronDown} from '@gravity-ui/icons';
import type {ButtonPin, DropdownMenuItem, DropdownMenuProps} from '@gravity-ui/uikit';
import {Button, DropdownMenu, Icon} from '@gravity-ui/uikit';

import {cancelQueryApi} from '../../../../store/reducers/cancelQuery';
import {selectActiveTabId, selectUserInput} from '../../../../store/reducers/query/query';
import type {QueryAction} from '../../../../types/store/query';
import {cn} from '../../../../utils/cn';
import createToast from '../../../../utils/createToast';
import {useTypedSelector} from '../../../../utils/hooks';
import {QUERY_ACTIONS} from '../../../../utils/query';
import {reachMetricaGoal} from '../../../../utils/yaMetrica';
import {NewSQL} from '../NewSQL/NewSQL';
import {queryExecutionManagerInstance} from '../QueryEditor/utils/queryExecutionManager';
import {SaveQuery} from '../SaveQuery/SaveQuery';
import i18n from '../i18n';

import {EditorButton} from './EditorButton';

import './QueryEditorControls.scss';

const b = cn('ydb-query-editor-controls');

interface QueryEditorControlsProps {
    isLoading: boolean;
    isStoppable: boolean;
    disabled?: boolean;
    highlightedAction: QueryAction;
    queryId?: string;
    database: string;
    isStreamingEnabled?: boolean;

    handleGetExplainQueryClick: (text: string) => void;
    handleGetExplainAnalyzeQueryClick: (text: string) => void;
    handleSendExecuteClick: (text: string) => void;
    onSettingsButtonClick: () => void;
}

const STOP_AUTO_HIDE_TIMEOUT = 5000;

interface ActionButtonProps {
    type: 'run' | 'explain';
    isHighlighted: boolean;
    isLoading: boolean;
    isStoppable: boolean;
    controlsDisabled: boolean;
    pin?: ButtonPin;
    onActionClick: () => void;
    renderStopButton: (props?: {pin?: ButtonPin}) => React.ReactNode;
}

const ActionButton = ({
    type,
    isHighlighted,
    isLoading,
    isStoppable,
    controlsDisabled,
    pin,
    onActionClick,
    renderStopButton,
}: ActionButtonProps) => {
    if (isStoppable && isLoading && isHighlighted) {
        return renderStopButton({pin});
    }

    const ButtonComponent = type === 'run' ? EditorButton.Run : EditorButton.Explain;

    return (
        <ButtonComponent
            onClick={onActionClick}
            disabled={controlsDisabled}
            loading={isLoading}
            pin={pin}
            view={isHighlighted ? 'action' : undefined}
        />
    );
};

const CANCEL_ERROR_ANIMATION_DURATION = 500;

export const QueryEditorControls = ({
    disabled,
    isLoading,
    isStoppable,
    highlightedAction,
    queryId,
    database,
    isStreamingEnabled,

    handleSendExecuteClick,
    onSettingsButtonClick,
    handleGetExplainQueryClick,
    handleGetExplainAnalyzeQueryClick,
}: QueryEditorControlsProps) => {
    const input = useTypedSelector(selectUserInput);
    const activeTabId = useTypedSelector(selectActiveTabId);
    const [sendCancelQuery, cancelQueryResponse] = cancelQueryApi.useCancelQueryMutation();
    const cancelErrorAnimationRef = React.useRef<number | null>(null);
    const [cancelQueryError, setCancelQueryError] = React.useState<boolean>(false);

    const onStopButtonClick = React.useCallback(async () => {
        reachMetricaGoal('stopQuery');
        try {
            if (isStreamingEnabled) {
                if (!activeTabId) {
                    return;
                }

                queryExecutionManagerInstance.abortQuery(activeTabId);
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
    }, [isStreamingEnabled, queryId, sendCancelQuery, database, activeTabId]);

    const isRunHighlighted = highlightedAction === QUERY_ACTIONS.execute;
    const isExplainHighlighted = highlightedAction === QUERY_ACTIONS.explain;
    const isExplainAnalyzeHighlighted = highlightedAction === QUERY_ACTIONS.explainAnalyze;

    const onRunButtonClick = React.useCallback(() => {
        handleSendExecuteClick(input);
    }, [handleSendExecuteClick, input]);

    const onExplainButtonClick = React.useCallback(() => {
        handleGetExplainQueryClick(input);
    }, [handleGetExplainQueryClick, input]);

    const onExplainAnalyzeButtonClick = React.useCallback(() => {
        handleGetExplainAnalyzeQueryClick(input);
    }, [handleGetExplainAnalyzeQueryClick, input]);

    React.useEffect(() => {
        return () => {
            if (cancelErrorAnimationRef.current) {
                window.clearTimeout(cancelErrorAnimationRef.current);
            }
        };
    }, []);

    const controlsDisabled = disabled || !input;

    const explainAnalyzeMenuItems = React.useMemo<DropdownMenuItem[]>(
        () => [
            {
                text: i18n('action.explain-analyze'),
                action: onExplainAnalyzeButtonClick,
            },
        ],
        [onExplainAnalyzeButtonClick],
    );

    const renderExplainAnalyzeSwitcher = React.useCallback<
        NonNullable<DropdownMenuProps<unknown>['renderSwitcher']>
    >(
        (props) => (
            <Button
                {...props}
                className={b('explain-analyze-button')}
                disabled={controlsDisabled}
                loading={isLoading}
                pin="brick-round"
                view={isExplainAnalyzeHighlighted ? 'action' : undefined}
                aria-label={i18n('action.explain-analyze')}
            >
                <Icon data={ChevronDown} size={16} />
            </Button>
        ),
        [controlsDisabled, isExplainAnalyzeHighlighted, isLoading],
    );

    const renderStopButton = (props?: {pin?: ButtonPin}) => (
        <EditorButton.Stop
            {...props}
            loading={cancelQueryResponse.isLoading}
            error={cancelQueryError}
            onClick={onStopButtonClick}
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
                <div className={b('explain-group')}>
                    <ActionButton
                        type="explain"
                        isHighlighted={isExplainHighlighted || isExplainAnalyzeHighlighted}
                        isLoading={isLoading}
                        isStoppable={isStoppable}
                        controlsDisabled={controlsDisabled}
                        pin="round-brick"
                        onActionClick={onExplainButtonClick}
                        renderStopButton={renderStopButton}
                    />
                    <DropdownMenu
                        items={explainAnalyzeMenuItems}
                        renderSwitcher={renderExplainAnalyzeSwitcher}
                        popupProps={{placement: 'bottom-start'}}
                    />
                </div>
                <EditorButton.Settings onClick={onSettingsButtonClick} isLoading={isLoading} />
            </div>
            <div className={b('right')}>
                <NewSQL />
                <SaveQuery buttonProps={{disabled}} />
            </div>
        </div>
    );
};
