import {ReactNode} from 'react';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';

import {RadioButton, Switch, HelpPopover} from '@gravity-ui/uikit';
import {Settings} from '@gravity-ui/navigation';

import favoriteFilledIcon from '../../assets/icons/star.svg';
import flaskIcon from '../../assets/icons/flask.svg';

import {
    ENABLE_QUERY_MODES_FOR_EXPLAIN,
    INVERTED_DISKS_KEY,
    THEME_KEY,
    USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
} from '../../utils/constants';

import {setSettingValue} from '../../store/reducers/settings';

import './UserSettings.scss';

const b = cn('ydb-user-settings');

enum Theme {
    light = 'light',
    dark = 'dark',
    system = 'system',
}

function UserSettings(props: any) {
    const _onThemeChangeHandler = (value: string) => {
        props.setSettingValue(THEME_KEY, value);
    };

    const _onInvertedDisksChangeHandler = (value: boolean) => {
        props.setSettingValue(INVERTED_DISKS_KEY, String(value));
    };

    const _onNodesEndpointChangeHandler = (value: boolean) => {
        props.setSettingValue(USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY, String(value));
    };

    const _onExplainQueryModesChangeHandler = (value: boolean) => {
        props.setSettingValue(ENABLE_QUERY_MODES_FOR_EXPLAIN, String(value));
    };

    const renderBreakNodesSettingsItem = (title: ReactNode) => {
        return (
            <div className={b('item-with-popup')}>
                {title}
                <HelpPopover
                    content="Use /viewer/json/nodes endpoint for Nodes Tab in diagnostics. It returns incorrect data on older versions"
                    contentClassName={b('popup')}
                    hasArrow={true}
                />
            </div>
        );
    };

    const renderEnableExplainQueryModesItem = (title: ReactNode) => {
        return (
            <div className={b('item-with-popup')}>
                {title}
                <HelpPopover
                    content="Script | Scan mode selector will affect Explain. May return incorrect data on older versions"
                    contentClassName={b('popup')}
                    hasArrow={true}
                />
            </div>
        );
    };

    return (
        <Settings>
            <Settings.Page
                id="general"
                title="General"
                icon={{data: favoriteFilledIcon, height: 14, width: 14}}
            >
                <Settings.Section title="General">
                    <Settings.Item title="Interface theme">
                        <RadioButton value={props.theme} onUpdate={_onThemeChangeHandler}>
                            <RadioButton.Option value={Theme.system}>System</RadioButton.Option>
                            <RadioButton.Option value={Theme.light}>Light</RadioButton.Option>
                            <RadioButton.Option value={Theme.dark}>Dark</RadioButton.Option>
                        </RadioButton>
                    </Settings.Item>
                </Settings.Section>
            </Settings.Page>
            <Settings.Page id="experiments" title="Experiments" icon={{data: flaskIcon}}>
                <Settings.Section title="Experiments">
                    <Settings.Item title="Inverted disks space indicators">
                        <Switch
                            checked={props.invertedDisks}
                            onUpdate={_onInvertedDisksChangeHandler}
                        />
                    </Settings.Item>
                    <Settings.Item
                        title="Break the Nodes tab in Diagnostics"
                        renderTitleComponent={renderBreakNodesSettingsItem}
                    >
                        <Switch
                            checked={props.useNodesEndpointInDiagnostics}
                            onUpdate={_onNodesEndpointChangeHandler}
                        />
                    </Settings.Item>
                    <Settings.Item
                        title="Enable query modes for explain"
                        renderTitleComponent={renderEnableExplainQueryModesItem}
                    >
                        <Switch
                            checked={props.enableQueryModesForExplain}
                            onUpdate={_onExplainQueryModesChangeHandler}
                        />
                    </Settings.Item>
                </Settings.Section>
            </Settings.Page>
        </Settings>
    );
}

const mapStateToProps = (state: any) => {
    const {theme, invertedDisks, useNodesEndpointInDiagnostics, enableQueryModesForExplain} =
        state.settings.userSettings;

    return {
        theme,
        invertedDisks: JSON.parse(invertedDisks),
        useNodesEndpointInDiagnostics: JSON.parse(useNodesEndpointInDiagnostics),
        enableQueryModesForExplain: JSON.parse(enableQueryModesForExplain),
    };
};

const mapDispatchToProps = {
    setSettingValue,
};

export default connect(mapStateToProps, mapDispatchToProps)(UserSettings);
