// copy from bem-cn-lite with export Modifications
declare module 'bem-cn-lite' {
    export interface Modifications {
        [name: string]: string | boolean | undefined;
    }

    declare function bemClassNameLite(blockName: string): {
        (
            elementName: string,
            modifiers: Modifications | null,
            mixin?: string | string[] | undefined,
        ): string;
        (elementName: string, mixin?: string | string[] | undefined): string;
        (elementName: string, modifiers: Modifications): string;
        (mods: Modifications | null, mixin?: string | string[] | undefined): string;
        (elementName: string): string;
        (mods: Modifications | null): string;
        (): string;
        builder(): import('bem-cn').Block;
    };
    declare namespace bemClassNameLite {
        let setup: (config: import('bem-cn').BemSettings) => void;
        let reset: () => void;
    }
    export default bemClassNameLite;
}
