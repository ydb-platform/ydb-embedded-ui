import {Keyboard} from '@gravity-ui/icons';
import {Flex, Hotkey, Icon, Link, List, Text} from '@gravity-ui/uikit';

import {settingsManager} from '../../../services/settings';
import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {cn} from '../../../utils/cn';
import {SHORTCUTS_HOTKEY} from '../hooks/useHotkeysPanel';
import i18n from '../i18n';

import './InformationPopup.scss';

const b = cn('information-popup');

export interface InformationPopupProps {
    onKeyboardShortcutsClick?: () => void;
}

export function InformationPopup({onKeyboardShortcutsClick}: InformationPopupProps) {
    const getDocumentationLink = () => {
        const lang = settingsManager.readUserSettingsValue(
            SETTING_KEYS.LANGUAGE,
            navigator.language,
        );
        return lang === 'ru' ? 'https://ydb.tech/docs/ru/' : 'https://ydb.tech/docs/en/';
    };

    return (
        <div className={b('content', {})}>
            <div className={b('docs')}>
                <Text variant="subheader-3" color="primary" className={b('title')}>
                    Documentation
                </Text>
                <div className={b('docs-list-wrap')}>
                    <List
                        items={[
                            {
                                text: i18n('help-center.item.documentation'),
                                url: getDocumentationLink(),
                            },
                        ]}
                        filterable={false}
                        virtualized={false}
                        renderItem={({text, url}) => (
                            <Link
                                className={b('docs-link')}
                                rel="noopener"
                                target="_blank"
                                href={url}
                                title={typeof text === 'string' ? text : undefined}
                            >
                                {text}
                            </Link>
                        )}
                        itemClassName={b('item')}
                    />
                </div>
            </div>

            <div className={b('footer')}>
                <Flex
                    justifyContent="space-between"
                    className={b('shortcuts-item')}
                    onClick={onKeyboardShortcutsClick}
                >
                    <Flex alignItems="center">
                        <div className={b('item-icon-wrap')}>
                            <Icon data={Keyboard} />
                        </div>
                        {i18n('help-center.footer.shortcuts')}
                    </Flex>
                    <Hotkey value={SHORTCUTS_HOTKEY} />
                </Flex>
            </div>
        </div>
    );
}
