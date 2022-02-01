const ENABLE_FULLSCREEN_MODE = 'ENABLE_FULLSCREEN_MODE';
const DISABLE_FULLSCREEN_MODE = 'DISABLE_FULLSCREEN_MODE';

const initialState = false;

const fullscreen = function (
    state = initialState,
    action: ReturnType<typeof enableFullscreen> | ReturnType<typeof disableFullscreen>,
) {
    switch (action.type) {
        case DISABLE_FULLSCREEN_MODE:
            return false;
        case ENABLE_FULLSCREEN_MODE:
            return true;
        default:
            return state;
    }
};

export function enableFullscreen() {
    return {
        type: ENABLE_FULLSCREEN_MODE,
    } as const;
}
export function disableFullscreen() {
    return {
        type: DISABLE_FULLSCREEN_MODE,
    } as const;
}

export default fullscreen;
