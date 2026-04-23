import React from 'react';

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

function normalizeIllustrationComponent(illustration: unknown): IllustrationComponent | undefined {
    const normalizedValue =
        typeof illustration === 'object' && illustration !== null && 'default' in illustration
            ? (illustration as {default?: unknown}).default
            : illustration;

    if (typeof normalizedValue === 'function') {
        return normalizedValue as IllustrationComponent;
    }

    if (typeof normalizedValue === 'string') {
        return function IllustrationImage({width, height, className, style, onClick}) {
            return React.createElement('img', {
                width,
                height,
                className,
                style,
                onClick,
                src: normalizedValue,
                alt: '',
            });
        };
    }

    return undefined;
}

export function getIllustration(name: IllustrationName): IllustrationComponent {
    return normalizeIllustrationComponent(uiFactory.illustrations?.[name]) ?? defaults[name];
}
