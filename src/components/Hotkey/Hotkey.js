import {Component} from 'react';
import PropTypes from 'prop-types';

import key from 'keymaster';

const propTypes = {
    settings: PropTypes.arrayOf(
        PropTypes.shape({
            keys: PropTypes.string.isRequired,
            handler: PropTypes.func.isRequired,
            scope: PropTypes.string,
            preventDefault: PropTypes.bool,
        }),
    ).isRequired,
};

function eventOnInput(evt) {
    const tagName = (evt.target || evt.srcElement).tagName;

    return /^(INPUT|TEXTAREA|SELECT)$/.test(tagName);
}

export default class Hotkey extends Component {
    componentDidMount() {
        const {settings} = this.props;

        if (!key) {
            return;
        }

        this.preparedSettings = this.prepareSettings(settings);

        // To use hotkeys inside inputs we need to specify scope, other events are filtered.
        key.filter = function (evt) {
            const currentScope = key.getScope();

            return !(eventOnInput(evt) && currentScope === 'all');
        };

        this.preparedSettings.forEach((setting) => {
            this.bindKey(setting.combo, setting.scope, setting.handler, setting.preventDefault);
        });
    }

    componentWillUnmount() {
        if (!key) {
            return;
        }

        this.preparedSettings.forEach((setting) => {
            this.unbindKey(setting.combo, setting.scope);
        });
    }

    prepareSettings(settings) {
        const preparedSettings = [];

        settings.forEach((item) => {
            const keyCombinations = item.keys.split(/\s*,\s*/);
            const scopes = item.scope.split(/\s*,\s*/);
            const preventDefault =
                typeof item.preventDefault !== 'undefined' ? item.preventDefault : true;

            keyCombinations.forEach((combo) => {
                scopes.forEach((scope) => {
                    if (typeof item.handler === 'function') {
                        preparedSettings.push({
                            combo: combo,
                            scope: scope,
                            handler: item.handler,
                            preventDefault: preventDefault,
                        });
                    }
                });
            });
        });

        return preparedSettings;
    }

    bindKey(combination, scope, handler, preventDefault) {
        key(combination, scope, (evt, shortcut) => {
            if (key.getScope() === shortcut.scope) {
                handler(evt, shortcut);

                if (preventDefault) {
                    evt.preventDefault();
                }
            }
        });
    }

    unbindKey(combination, scope) {
        key.unbind(combination, scope);
    }

    render() {
        return null;
    }
}

Hotkey.propTypes = propTypes;
