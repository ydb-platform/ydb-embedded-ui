import type {ReactNode} from 'react';

import {RadioButton, Switch} from '@gravity-ui/uikit';
import {Settings} from '@gravity-ui/navigation';

import {LabelWithPopover} from '../../components/LabelWithPopover/LabelWithPopover';

import {useSetting} from '../../utils/hooks';

import {b} from './UserSettings';

export type SettingsElementType = 'switch' | 'radio';

export interface SettingProps {
    type?: SettingsElementType;
    title: string;
    settingKey: string;
    withHelpPopover?: boolean;
    helpPopoverContent?: ReactNode;
    values?: {value: string; content: string}[];
    defaultValue?: unknown;
}

export const Setting = ({
    type = 'switch',
    settingKey,
    title,
    withHelpPopover,
    helpPopoverContent,
    values,
    defaultValue,
}: SettingProps) => {
    const [settingValue, setValue] = useSetting(settingKey, defaultValue);

    const renderTitleComponent = (value: ReactNode) => {
        if (withHelpPopover) {
            return (
                <LabelWithPopover
                    className={b('item-with-popup')}
                    contentClassName={b('popup')}
                    text={value}
                    popoverContent={helpPopoverContent}
                />
            );
        }

        return value;
    };

    const getSettingsElement = (elementType: SettingsElementType) => {
        switch (elementType) {
            case 'switch': {
                return <Switch checked={Boolean(settingValue)} onUpdate={setValue} />;
            }

            case 'radio': {
                if (!values) {
                    return null;
                }

                return (
                    <RadioButton value={String(settingValue)} onUpdate={setValue}>
                        {values.map(({value, content}) => {
                            return (
                                <RadioButton.Option value={value} key={value}>
                                    {content}
                                </RadioButton.Option>
                            );
                        })}
                    </RadioButton>
                );
            }

            default:
                return null;
        }
    };

    return (
        <Settings.Item title={title} renderTitleComponent={renderTitleComponent}>
            {getSettingsElement(type)}
        </Settings.Item>
    );
};
