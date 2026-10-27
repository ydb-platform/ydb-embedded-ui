import type {NumberInputProps} from '@gravity-ui/uikit';
import {NumberInput} from '@gravity-ui/uikit';

import {useDebouncedValue} from '../../utils/hooks/useDebouncedValue';

interface DebouncedInputProps extends NumberInputProps {
    debounce?: number;
    isEqual?: (submitted: number | null, received: number | null) => boolean;
}

export const DebouncedNumberInput = ({
    onUpdate,
    value = null,
    debounce = 200,
    isEqual,
    ...rest
}: DebouncedInputProps) => {
    const [currentValue, handleUpdate] = useDebouncedValue<number | null>({
        value,
        onUpdate,
        debounce,
        isEqual,
    });

    return <NumberInput value={currentValue} onUpdate={handleUpdate} {...rest} />;
};
