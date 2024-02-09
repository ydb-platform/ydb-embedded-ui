import React from 'react';

import {isSlotComponent, isSlotElement} from './utils';
import type {SlotComponent, SlotItem} from './types';

export class SlotMap {
    readonly children?: React.ReactNode = null;

    private slots: Map<SlotComponent, SlotItem<React.PropsWithChildren<{}>>>;

    constructor(children: React.ReactNode) {
        const defaultContent: React.ReactNode[] = [];

        this.slots = new Map();

        React.Children.forEach(children, (child) => {
            if (isSlotElement<React.PropsWithChildren<{}>>(child)) {
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

        const hasContent = defaultContent.length > 0;
        if (hasContent) {
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
