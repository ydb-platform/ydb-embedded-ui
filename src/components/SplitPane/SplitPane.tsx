import React from 'react';

import {debounce} from 'lodash';
import type {SplitProps} from 'react-split';
import SplitPaneLib from 'react-split';

import {cn} from '../../utils/cn';
import {useSetting} from '../../utils/hooks/useSetting';

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
const SAVE_DEBOUNCE_MS = 200;

function SplitPane(props: SplitPaneProps) {
    const [innerSizes, setInnerSizes] = React.useState<number[]>();
    const [savedSizesString, setSavedSizesString] = useSetting<string | undefined>(
        props.defaultSizePaneKey,
    );

    const saveSizesStringDebounced = React.useMemo(() => {
        return debounce((value: string) => setSavedSizesString(value), SAVE_DEBOUNCE_MS);
    }, [setSavedSizesString]);

    React.useEffect(() => {
        return () => {
            saveSizesStringDebounced.cancel();
        };
    }, [saveSizesStringDebounced]);

    const getDefaultSizePane = () => {
        const {defaultSizes = sizesDefaultInner, initialSizes} = props;
        if (initialSizes) {
            return initialSizes;
        }
        const sizes = savedSizesString?.split(',').map(Number);
        return sizes || defaultSizes;
    };
    const setDefaultSizePane = (sizes: number[]) => {
        saveSizesStringDebounced(sizes.join(','));
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

    React.useEffect(() => {
        const {collapsedSizes, triggerCollapse} = props;
        if (triggerCollapse) {
            const newSizes = collapsedSizes || minSizeDefaultInner;
            setDefaultSizePane(newSizes);
            setInnerSizes(newSizes);
        }
    }, [props.triggerCollapse]);

    React.useEffect(() => {
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
