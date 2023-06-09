import {Button, DropdownMenu} from '@gravity-ui/uikit';
import {useEffect, useMemo} from 'react';

import {QueryModes} from '../../../../types/store/query';
import {Icon} from '../../../../components/Icon';

import SaveQuery from '../SaveQuery/SaveQuery';

import {QueryEditorControlsProps, b} from './shared';

import './QueryEditorControls.scss';

type OldQueryModes = QueryModes.script | QueryModes.scan;

export const QueryModeSelectorTitles = {
    [QueryModes.script]: 'Script',
    [QueryModes.scan]: 'Scan',
} as const;

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
    // On setting change when 'data' or 'query' option selected
    useEffect(() => {
        if (queryMode !== QueryModes.script && queryMode !== QueryModes.scan) {
            onUpdateQueryMode(QueryModes.script);
        }
    }, [queryMode, onUpdateQueryMode]);

    const runModeSelectorMenuItems = useMemo(() => {
        return Object.entries(QueryModeSelectorTitles).map(([mode, title]) => {
            return {
                text: `Run ${title}`,
                action: () => {
                    onUpdateQueryMode(mode as OldQueryModes);
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
                        {`Run ${QueryModeSelectorTitles[queryMode as OldQueryModes]}`}
                    </Button>
                    <DropdownMenu
                        items={runModeSelectorMenuItems}
                        popupProps={{className: b('select-query-action-popup')}}
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
