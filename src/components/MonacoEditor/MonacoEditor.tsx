import {lazyComponent} from '../../utils/lazyComponent';

export const MonacoEditor = lazyComponent(async () => {
    const Editor = (await import('react-monaco-editor')).default;
    const {registerLanguages} = await import('../../utils/monaco');
    registerLanguages();
    return {Editor};
}, 'Editor');
