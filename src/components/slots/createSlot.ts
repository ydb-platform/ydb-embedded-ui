import type {SlotComponent} from './types';

export function createSlot<Props = {}, Type = never>(name = 'unknown') {
    const Slot: SlotComponent<Props, Type> = () => null;

    Slot.displayName = `Slot(${name})`;
    Slot.__slotName = name;

    return Slot;
}
