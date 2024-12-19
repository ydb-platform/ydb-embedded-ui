export async function insertSnippetToEditor(input: string) {
    let retry = 1;

    const checkEditor = async () => {
        if (!window.ydbEditor) {
            if (retry) {
                await new Promise((r) => {
                    window.setTimeout(r, 100);
                });
                retry -= 1;
                checkEditor();
            } else {
                return false;
            }
        }
        return true;
    };
    const editor = await checkEditor();
    if (!editor) {
        console.error('Monaco editor not found');
        return;
    }

    window.ydbEditor?.trigger(undefined, 'insertSnippetToEditor', input);
}
