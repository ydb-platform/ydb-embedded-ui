import {
    AccessDenied,
    Identity,
    InternalError,
    NoSearchResults,
    SuccessOperation,
} from '@gravity-ui/illustrations';

import type {IllustrationComponent, IllustrationName} from '../uiFactory/types';
import {uiFactory} from '../uiFactory/uiFactory';

const defaults: Record<IllustrationName, IllustrationComponent> = {
    InternalError,
    AccessDenied,
    Unauthenticated: Identity,
    NoSearchResults,
    SuccessOperation,
};

export function getIllustration(name: IllustrationName): IllustrationComponent {
    return uiFactory.illustrations?.[name] ?? defaults[name];
}
