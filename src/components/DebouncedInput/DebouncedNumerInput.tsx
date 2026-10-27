import type {NumberInputProps} from '@gravity-ui/uikit';
import {NumberInput} from '@gravity-ui/uikit';

import {useDebouncedValue} from '../../utils/hooks/useDebouncedValue';

interface DebouncedInputProps extends NumberInputProps {
    debounce?: number;
    normalizeValue?: (value: number | null) => number | null;
}

export const DebouncedNumberInput = ({
    onUpdate,
    value = null,
    debounce = 200,
    normalizeValue,
    ...rest
}: DebouncedInputProps) => {
    const [currentValue, handleUpdate] = useDebouncedValue<number | null>({
        value,
        onUpdate,
        debounce,
        normalizeValue,
    });

    return <NumberInput value={currentValue} onUpdate={handleUpdate} {...rest} />;
};
