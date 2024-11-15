export function insertSnipperToEditor(input: string) {
    if (!window.ydbEditor) {
        console.error('Monaco editor not found');
    }
    window.ydbEditor?.trigger(undefined, 'insertSnippetToEditor', input);
}
