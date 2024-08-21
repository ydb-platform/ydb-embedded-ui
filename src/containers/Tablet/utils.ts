export function hasHive(id?: string): id is string {
    return Boolean(id && id !== '0');
}
