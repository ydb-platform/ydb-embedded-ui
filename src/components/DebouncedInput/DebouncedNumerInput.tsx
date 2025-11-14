import type {NumberInputProps} from '@gravity-ui/uikit';
import {NumberInput} from '@gravity-ui/uikit';

import {useDebouncedValue} from '../../utils/hooks/useDebouncedValue';

interface DebouncedInputProps extends NumberInputProps {
    debounce?: number;
}

export const DebouncedNumberInput = ({
    onUpdate,
    value = null,
    debounce = 200,
    ...rest
}: DebouncedInputProps) => {
    const [currentValue, handleUpdate] = useDebouncedValue<number | null>({
        value,
        onUpdate,
        debounce,
    });

    return <NumberInput value={currentValue} onUpdate={handleUpdate} {...rest} />;
};
