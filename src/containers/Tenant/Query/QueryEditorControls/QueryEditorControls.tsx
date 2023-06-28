import block from 'bem-cn-lite';

import {Button, DropdownMenu} from '@gravity-ui/uikit';
import {useMemo} from 'react';

import {QueryModes} from '../../../../types/store/query';
import {Icon} from '../../../../components/Icon';

import SaveQuery from '../SaveQuery/SaveQuery';

import i18n from '../i18n';

import './QueryEditorControls.scss';

const queryModeSelectorQa = 'query-mode-selector';
const queryModeSelectorPopupQa = 'query-mode-selector-popup';

const b = block('ydb-query-editor-controls');

const OldQueryModeSelectorTitles = {
    [QueryModes.script]: 'Script',
    [QueryModes.scan]: 'Scan',
} as const;

const QueryModeSelectorTitles = {
    [QueryModes.script]: 'Script',
    [QueryModes.scan]: 'Scan',
    [QueryModes.data]: 'Data',
    [QueryModes.query]: 'Query',
} as const;

interface QueryEditorControlsProps {
    onRunButtonClick: (mode?: QueryModes) => void;
    runIsLoading: boolean;
    onExplainButtonClick: (mode?: QueryModes) => void;
    explainIsLoading: boolean;
    onSaveQueryClick: (queryName: string) => void;
    savedQueries: unknown;
    disabled: boolean;
    onUpdateQueryMode: (mode: QueryModes) => void;
    queryMode: QueryModes;
    enableAdditionalQueryModes: boolean;
}

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
    enableAdditionalQueryModes,
}: QueryEditorControlsProps) => {
    const querySelectorMenuItems = useMemo(() => {
        const titles = enableAdditionalQueryModes
            ? QueryModeSelectorTitles
            : OldQueryModeSelectorTitles;

        return Object.entries(titles).map(([mode, title]) => {
            return {
                text: title,
                action: () => {
                    onUpdateQueryMode(mode as QueryModes);
                },
            };
        });
    }, [onUpdateQueryMode, enableAdditionalQueryModes]);

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
                    popupProps={{
                        className: b('mode-selector__popup'),
                        qa: queryModeSelectorPopupQa,
                    }}
                    switcher={
                        <Button className={b('mode-selector__button')} qa={queryModeSelectorQa}>
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
