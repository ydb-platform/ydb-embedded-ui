import type {SlotItem, SlotItemType} from '../../../store/reducers/pdisk/types';

export function isVDiskSlot(slot: SlotItem<SlotItemType>): slot is SlotItem<'vDisk'> {
    return slot.SlotType === 'vDisk';
}

export function isLogSlot(slot: SlotItem<SlotItemType>): slot is SlotItem<'log'> {
    return slot.SlotType === 'log';
}

export function isEmptySlot(slot: SlotItem<SlotItemType>): slot is SlotItem<'empty'> {
    return slot.SlotType === 'empty';
}
