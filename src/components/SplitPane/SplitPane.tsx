import cn from 'bem-cn-lite';
import React, {useEffect, useState} from 'react';

import SplitPaneLib, {SplitProps} from 'react-split';

import './SplitPane.scss';

const b = cn('kv-split');

interface SplitPaneProps {
    children: React.ReactNode;
    defaultSizePaneKey: string;
    direction?: SplitProps['direction'];
    defaultSizes?: SplitProps['sizes'];
    initialSizes?: SplitProps['sizes'];
    collapsedSizes?: SplitProps['sizes'];
    minSize?: number[];
    triggerCollapse?: boolean;
    triggerExpand?: boolean;
    onSplitStartDragAdditional?: VoidFunction;
    onSplitDragAdditional?: VoidFunction;
}

const minSizeDefaultInner = [0, 100];
const sizesDefaultInner = [50, 50];

function SplitPane(props: SplitPaneProps) {
    const [innerSizes, setInnerSizes] = useState<number[]>();

    const getDefaultSizePane = () => {
        const {defaultSizePaneKey, defaultSizes = sizesDefaultInner, initialSizes} = props;
        if (initialSizes) {
            return initialSizes;
        }
        const sizes = localStorage.getItem(defaultSizePaneKey)?.split(',').map(Number);
        return sizes || defaultSizes;
    };
    const setDefaultSizePane = (sizes: number[]) => {
        const {defaultSizePaneKey} = props;
        localStorage.setItem(defaultSizePaneKey, sizes.join(','));
    };
    const onDragHandler = (sizes: number[]) => {
        const {onSplitDragAdditional} = props;
        if (onSplitDragAdditional) {
            onSplitDragAdditional();
        }
        setDefaultSizePane(sizes);
    };

    const onDragStartHandler = () => {
        const {onSplitStartDragAdditional} = props;
        if (onSplitStartDragAdditional) {
            onSplitStartDragAdditional();
        }
        setInnerSizes(undefined);
    };

    useEffect(() => {
        const {collapsedSizes, triggerCollapse} = props;
        if (triggerCollapse) {
            const newSizes = collapsedSizes || minSizeDefaultInner;
            setDefaultSizePane(newSizes);
            setInnerSizes(newSizes);
        }
    }, [props.triggerCollapse]);

    useEffect(() => {
        const {triggerExpand, defaultSizes} = props;
        const newSizes = defaultSizes || sizesDefaultInner;
        if (triggerExpand) {
            setDefaultSizePane(newSizes);
            setInnerSizes(newSizes);
        }
    }, [props.triggerExpand]);
    return (
        <React.Fragment>
            <SplitPaneLib
                direction={props.direction || 'horizontal'}
                sizes={innerSizes || getDefaultSizePane()}
                minSize={props.minSize || [0, 0]}
                onDrag={onDragHandler}
                className={b(null, props.direction || 'horizontal')}
                gutterSize={8}
                onDragStart={onDragStartHandler}
                expandToMin
            >
                {props.children}
            </SplitPaneLib>
        </React.Fragment>
    );
}

export default SplitPane;
