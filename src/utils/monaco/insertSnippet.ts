export function insertSnippetToEditor(input: string) {
    if (!window.ydbEditor) {
        console.error('Monaco editor not found');
    }
    window.ydbEditor?.trigger(undefined, 'insertSnippetToEditor', input);
}
