import React from 'react';
import block from 'bem-cn-lite';
import {TextInput} from '@yandex-cloud/uikit';

import i18n from '../i18n';

const b = block('nv-settings-search');

interface SettingsSearchProps {
    className?: string;
    onChange: (search: string) => void;
    debounce?: number;
    inputRef?: React.Ref<HTMLInputElement>;
}

export function SettingsSearch({
    className,
    onChange,
    debounce = 200,
    inputRef,
}: SettingsSearchProps) {
    const [search, setSearch] = React.useState<string>();
    const onChangeRef = React.useRef(onChange);
    onChangeRef.current = onChange;
    const debounceRef = React.useRef(debounce);
    debounceRef.current = debounce;

    React.useEffect(() => {
        let timerId: number;
        if (search !== undefined) {
            timerId = window.setTimeout(() => {
                onChangeRef.current(search);
            }, debounceRef.current);
        }
        return () => {
            clearTimeout(timerId);
        };
    }, [search]);
    return (
        <div className={b(null, className)}>
            <TextInput
                controlRef={(node) => {
                    if (typeof inputRef === 'function') {
                        inputRef(node as HTMLInputElement);
                    } else if (inputRef) {
                        (inputRef.current as HTMLInputElement) = node as HTMLInputElement;
                    }
                }}
                hasClear
                autoFocus
                placeholder={i18n('placeholder_search')}
                value={search}
                onUpdate={setSearch}
            />
        </div>
    );
}
