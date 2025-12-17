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
    const {
        collapsedSizes,
        triggerCollapse,
        triggerExpand,
        defaultSizes: defaultSizesProp,
        initialSizes,
    } = props;
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

    const defaultSizePane = React.useMemo(() => {
        if (initialSizes) {
            return initialSizes;
        }
        const sizes = savedSizesString?.split(',').map(Number);
        return sizes || defaultSizesProp || sizesDefaultInner;
    }, [defaultSizesProp, initialSizes, savedSizesString]);
    const setDefaultSizePane = React.useCallback(
        (sizes: number[]) => {
            saveSizesStringDebounced(sizes.join(','));
        },
        [saveSizesStringDebounced],
    );
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
        if (triggerCollapse) {
            const newSizes = collapsedSizes || minSizeDefaultInner;
            setDefaultSizePane(newSizes);
            setInnerSizes(newSizes);
        }
    }, [collapsedSizes, triggerCollapse, setDefaultSizePane]);

    React.useEffect(() => {
        const newSizes = defaultSizesProp || sizesDefaultInner;
        if (triggerExpand) {
            setDefaultSizePane(newSizes);
            setInnerSizes(newSizes);
        }
    }, [defaultSizesProp, triggerExpand, setDefaultSizePane]);
    return (
        <React.Fragment>
            <SplitPaneLib
                direction={props.direction || 'horizontal'}
                sizes={innerSizes || defaultSizePane}
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
