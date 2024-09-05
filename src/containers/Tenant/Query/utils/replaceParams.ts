// Takes a template string and an object of parameters, and replaces placeholders in the template with corresponding values
// from the parameters object.
export function replaceParams(template: string, params: Record<string, string>) {
    return template.replace(/\${(\w+)}/g, (_, key) => params[key] || _);
}
