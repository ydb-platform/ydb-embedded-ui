import {Button, DropdownMenu} from '@gravity-ui/uikit';
import {useMemo} from 'react';

import {QueryModes} from '../../../../types/store/query';
import {Icon} from '../../../../components/Icon';

import SaveQuery from '../SaveQuery/SaveQuery';

import {b, QueryEditorControlsProps, QueryModeSelectorTitles} from './shared';

import './QueryEditorControls.scss';

export const OldQueryEditorControls = ({
    onRunButtonClick,
    runIsLoading,
    onExplainButtonClick,
    explainIsLoading,
    onSaveQueryClick,
    savedQueries,
    disabled,
    onUpdateQueryMode,
    queryMode,
}: QueryEditorControlsProps) => {
    const runModeSelectorMenuItems = useMemo(() => {
        return Object.entries(QueryModeSelectorTitles).map(([mode, title]) => {
            return {
                text: `Run ${title}`,
                action: () => {
                    onUpdateQueryMode(mode as QueryModes);
                },
            };
        });
    }, [onUpdateQueryMode]);

    return (
        <div className={b()}>
            <div className={b('left')}>
                <div className={b('run')}>
                    <Button
                        onClick={() => onRunButtonClick(queryMode)}
                        view="action"
                        pin="round-brick"
                        disabled={disabled}
                        loading={runIsLoading}
                    >
                        <Icon name="startPlay" viewBox="0 0 16 16" width={16} height={16} />
                        {`Run ${QueryModeSelectorTitles[queryMode]}`}
                    </Button>
                    <DropdownMenu
                        items={runModeSelectorMenuItems}
                        popupClassName={b('select-query-action-popup')}
                        switcher={
                            <Button
                                view="action"
                                pin="brick-round"
                                disabled={disabled}
                                loading={runIsLoading}
                                className={b('select-query-action')}
                            >
                                <Icon name="chevron-down" width={16} height={16} />
                            </Button>
                        }
                    />
                </div>
                <Button
                    onClick={() => {
                        // Without defined query mode it sends 'explain' action
                        onExplainButtonClick();
                    }}
                    disabled={disabled}
                    loading={explainIsLoading}
                >
                    Explain
                </Button>
            </div>
            <SaveQuery
                savedQueries={savedQueries}
                onSaveQuery={onSaveQueryClick}
                saveButtonDisabled={disabled}
            />
        </div>
    );
};
