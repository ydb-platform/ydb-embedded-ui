// Navigation and cache resets advance this generation so late requests cannot change auth state.
let requestScope = 0;

export function getRequestScope() {
    return requestScope;
}

export function advanceRequestScope() {
    requestScope += 1;
}
