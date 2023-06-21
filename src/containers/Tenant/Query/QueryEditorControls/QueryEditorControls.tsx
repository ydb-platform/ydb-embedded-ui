import {Button, DropdownMenu} from '@gravity-ui/uikit';
import {useMemo} from 'react';

import {QueryModes} from '../../../../types/store/query';
import {Icon} from '../../../../components/Icon';

import SaveQuery from '../SaveQuery/SaveQuery';

import i18n from '../i18n';

import {QueryEditorControlsProps, b} from './shared';

import './QueryEditorControls.scss';

export const QueryModeSelectorTitles = {
    [QueryModes.script]: 'Script',
    [QueryModes.scan]: 'Scan',
    [QueryModes.data]: 'Data',
    [QueryModes.query]: 'Query',
} as const;

export const QueryEditorControls = ({
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
    const querySelectorMenuItems = useMemo(() => {
        return Object.entries(QueryModeSelectorTitles).map(([mode, title]) => {
            return {
                text: title,
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
                        onClick={() => {
                            onRunButtonClick(queryMode);
                        }}
                        view="action"
                        disabled={disabled}
                        loading={runIsLoading}
                    >
                        <Icon name="startPlay" viewBox="0 0 16 16" width={16} height={16} />
                        {'Run'}
                    </Button>
                </div>
                <Button
                    onClick={() => {
                        onExplainButtonClick(queryMode);
                    }}
                    disabled={disabled}
                    loading={explainIsLoading}
                >
                    Explain
                </Button>
                <DropdownMenu
                    items={querySelectorMenuItems}
                    popupProps={{className: b('mode-selector__popup')}}
                    switcher={
                        <Button className={b('mode-selector__button')}>
                            <span className={b('mode-selector__button-content')}>
                                {`${i18n('controls.query-mode-selector_type')} ${
                                    QueryModeSelectorTitles[queryMode]
                                }`}
                                <Icon name="chevron-down" width={16} height={16} />
                            </span>
                        </Button>
                    }
                />
            </div>
            <SaveQuery
                savedQueries={savedQueries}
                onSaveQuery={onSaveQueryClick}
                saveButtonDisabled={disabled}
            />
        </div>
    );
};
