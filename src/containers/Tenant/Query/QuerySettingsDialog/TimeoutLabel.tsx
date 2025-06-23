import {HelpMark, Switch} from '@gravity-ui/uikit';
import {StringParam, useQueryParams} from 'use-query-params';

import {cn} from '../../../../utils/cn';
import {ENABLE_QUERY_STREAMING} from '../../../../utils/constants';
import {useSetting} from '../../../../utils/hooks';

import {QUERY_SETTINGS_FIELD_SETTINGS} from './constants';
import i18n from './i18n';

import './TimeoutLabel.scss';

const b = cn('ydb-timeout-label');

interface TimeoutLabelProps {
    isDisabled?: boolean;
    isChecked: boolean;
    onToggle: (enabled: boolean) => void;
}

export function TimeoutLabel({isDisabled, isChecked, onToggle}: TimeoutLabelProps) {
    const [isQueryStreamingEnabled] = useSetting<boolean>(ENABLE_QUERY_STREAMING);

    // Temporary check: disable streaming UI if backend parameter contains "oidc"
    const [{backend}] = useQueryParams({backend: StringParam});
    const isOidcBackend = backend && backend.includes('oidc');

    const shouldShowStreamingUI = isQueryStreamingEnabled && !isOidcBackend;

    if (shouldShowStreamingUI) {
        return (
            <div className={b('switch-title')}>
                <Switch
                    disabled={isDisabled}
                    checked={isChecked}
                    onUpdate={onToggle}
                    className={b('switch')}
                    content={QUERY_SETTINGS_FIELD_SETTINGS.timeout.title}
                />
                {isDisabled && (
                    <HelpMark className={b('question-icon')} placement="bottom-start">
                        {i18n('form.timeout.disabled')}
                    </HelpMark>
                )}
            </div>
        );
    }

    return (
        <label htmlFor="timeout" className={b('label-title')}>
            {QUERY_SETTINGS_FIELD_SETTINGS.timeout.title}
        </label>
    );
}
