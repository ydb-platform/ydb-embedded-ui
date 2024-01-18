import React from 'react';

import {isSlotComponent, isSlotElement} from './utils';
import type {SlotComponent, SlotItem} from './types';

export interface SlotMapOptions {
    defaultSlot?: React.FC<any>;
    onlySlots?: SlotComponent<any, any>[];
}

export class SlotMap {
    readonly children?: React.ReactNode = null;

    private slots: Map<SlotComponent, SlotItem<React.PropsWithChildren<{}>>>;

    constructor(children: React.ReactNode, options: SlotMapOptions = {}) {
        const {defaultSlot, onlySlots} = options;
        const defaultContent: React.ReactNode[] = [];

        this.slots = new Map();

        if (defaultSlot && !isSlotComponent(defaultSlot)) {
            throw new Error(
                'Invalid default slot component. Should be a component created using "createSlot".',
            );
        }

        function filterSlot(slot: SlotComponent<any, any>) {
            if (!onlySlots) {
                return true;
            }

            return slot === defaultSlot || onlySlots.includes(slot);
        }

        React.Children.forEach(children, (child) => {
            if (isSlotElement<React.PropsWithChildren<{}>>(child) && filterSlot(child.type)) {
                const {type, props, ref} = child;

                if (this.slots.has(type)) {
                    throw new Error(
                        `Duplicate slot elements with name "${type.__slotName}" found.`,
                    );
                }

                this.slots.set(type, {
                    name: type.__slotName,
                    props,
                    ref,
                    rendered: props.children,
                });
            } else if (child !== null && child !== undefined && child !== '') {
                defaultContent.push(child);
            }
        });

        const defaultSlotItem = defaultSlot ? this.slots.get(defaultSlot) : undefined;
        const hasContent = defaultContent.length > 0;

        if (defaultSlotItem && hasContent) {
            throw new Error(
                `Extraneous children found when component already has explicitly default slot with name "${defaultSlotItem.name}".`,
            );
        }

        if (defaultSlotItem) {
            this.children = defaultSlotItem.rendered;
        } else if (hasContent) {
            this.children = defaultContent;
        }
    }

    get<Props, Type>(slot: SlotComponent<Props, Type>): SlotItem<Props, Type> | undefined {
        if (!isSlotComponent(slot)) {
            throw new Error(
                'Invalid slot component. Should be a component created using "createSlot".',
            );
        }

        return this.slots.get(slot) as SlotItem<Props, Type> | undefined;
    }
}
