import {Keyboard} from '@gravity-ui/icons';
import {Flex, Hotkey, Icon, Link, List, Text} from '@gravity-ui/uikit';

import {settingsManager} from '../../../services/settings';
import {cn} from '../../../utils/cn';
import {LANGUAGE_KEY} from '../../../utils/constants';
import {SHORTCUTS_HOTKEY} from '../constants';
import i18n from '../i18n';

import './InformationPopup.scss';

const b = cn('information-popup');

export interface InformationPopupProps {
    /** The keyboard shortcuts action handler */
    onKeyboardShortcutsClick?: () => void;
    /** Class for the component */
    className?: string;
}

export function InformationPopup({onKeyboardShortcutsClick, className}: InformationPopupProps) {
    // Get documentation link based on language settings
    const getDocumentationLink = () => {
        const lang = settingsManager.readUserSettingsValue(LANGUAGE_KEY, navigator.language);
        return lang === 'ru' ? 'https://ydb.tech/docs/ru/' : 'https://ydb.tech/docs/en/';
    };

    return (
        <div className={b('content', {}, className)}>
            {/* Documentation section */}
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
