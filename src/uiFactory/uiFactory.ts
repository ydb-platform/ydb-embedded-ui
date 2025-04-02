import type {UIFactory} from './types';

const uiFactoryBase: UIFactory = {};

export function configureUIFactory(overrides: UIFactory) {
    Object.assign(uiFactoryBase, overrides);
}

export const uiFactory = new Proxy(uiFactoryBase, {
    set: () => {
        throw new Error('Use configureUIFactory(...) method instead of direct modifications');
    },
});
