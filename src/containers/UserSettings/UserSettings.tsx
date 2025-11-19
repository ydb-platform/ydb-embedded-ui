import React from 'react';

import {Settings} from '@gravity-ui/navigation';
import {Text} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';

import {selectID, selectUser} from '../../store/reducers/authentication/authentication';
import {settingsApi} from '../../store/reducers/settings/api';
import {uiFactory} from '../../uiFactory/uiFactory';
import {useTypedSelector} from '../../utils/hooks';

import {Setting} from './Setting';
import type {YDBEmbeddedUISettings} from './settings';

interface UserSettingsProps {
    settings: YDBEmbeddedUISettings;
}

export const UserSettings = ({settings: userSettings}: UserSettingsProps) => {
    const settingsNames = React.useMemo(() => {
        const names: string[] = [];

        userSettings.forEach((page) => {
            page.sections.forEach((section) => {
                section.settings.forEach((setting) => {
                    if (setting.type !== 'info') {
                        names.push(setting.settingKey);
                    }
                });
            });
        });

        return names;
    }, [userSettings]);

    const authUserSID = useTypedSelector(selectUser);
    const anonymosUserId = useTypedSelector(selectID);

    const user = authUserSID || anonymosUserId;
    const shouldUseMetaSettings = uiFactory.useMetaSettings && user;

    const params = shouldUseMetaSettings
        ? {
              name: settingsNames,
              user,
          }
        : skipToken;

    const {isLoading} = settingsApi.useGetSettingsQuery(params);

    return (
        <Settings loading={isLoading}>
            {userSettings.map((page) => {
                const {id, title, icon, sections = [], hideTitle} = page;

                return (
                    <Settings.Page key={id} id={id} title={title} icon={icon}>
                        {sections.map((section) => {
                            const {title: sectionTitle, settings: sectionSettings = []} = section;

                            return (
                                <Settings.Section
                                    key={id}
                                    title={sectionTitle}
                                    hideTitle={hideTitle}
                                >
                                    {sectionSettings.map((setting) => {
                                        if (setting.type === 'info') {
                                            return (
                                                <Settings.Item key={setting.title} {...setting}>
                                                    {setting.content}
                                                </Settings.Item>
                                            );
                                        }
                                        const {description, ...rest} = setting;
                                        return (
                                            <Settings.Item
                                                key={setting.title}
                                                align="top"
                                                {...rest}
                                            >
                                                <Setting {...setting} />
                                                <Text color="secondary" as="div">
                                                    {description}
                                                </Text>
                                            </Settings.Item>
                                        );
                                    })}
                                </Settings.Section>
                            );
                        })}
                    </Settings.Page>
                );
            })}
        </Settings>
    );
};
