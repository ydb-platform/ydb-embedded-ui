import {Flex, Hotkey, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import i18n from '../i18n';

import {HOTKEY_LABELS} from './constants';

import './QueryEditorZeroTabsState.scss';

const b = cn('ydb-query-editor-zero-tabs-state');

interface QueryEditorZeroTabsStateProps {
    onCreateTab: VoidFunction;
}

export function QueryEditorZeroTabsState({onCreateTab}: QueryEditorZeroTabsStateProps) {
    return (
        <Flex className={b()} grow={1} justifyContent="center" alignItems="center">
            <button
                type="button"
                className={b('card')}
                onClick={onCreateTab}
                aria-label={i18n('editor-tabs.empty-state.create-query')}
                data-qa="query-editor-zero-tabs-state"
            >
                <Flex className={b('card-inner')} justifyContent="center" alignItems="center">
                    <Flex
                        className={b('content')}
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Text as="span" variant="subheader-2" className={b('title')}>
                            {i18n('editor-tabs.empty-state.create-query')}
                        </Text>
                        <Hotkey value={HOTKEY_LABELS.newTab} className={b('hotkey')} />
                    </Flex>
                </Flex>
            </button>
        </Flex>
    );
}
