import {SingleProgress} from './SingleProgress';
import {StackProgress} from './StackProgress';
import type {ProgressWrapperProps} from './types';

export function ProgressWrapper(props: ProgressWrapperProps) {
    if ('stack' in props && props.stack) {
        return <StackProgress {...props} />;
    }
    return <SingleProgress {...props} />;
}
