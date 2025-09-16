import type {TextInputProps} from '@gravity-ui/uikit';
import {TextInput} from '@gravity-ui/uikit';

import {useDebouncedValue} from '../../utils/hooks/useDebouncedValue';

interface DebouncedInputProps extends TextInputProps {
    debounce?: number;
}

export const DebouncedTextInput = ({
    onUpdate,
    value = '',
    debounce = 200,
    ...rest
}: DebouncedInputProps) => {
    const [currentValue, handleUpdate] = useDebouncedValue<string>({value, onUpdate, debounce});

    return <TextInput value={currentValue} onUpdate={handleUpdate} {...rest} />;
};
