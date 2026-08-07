import {componentsRegistry} from '../componentsRegistry';
import {Registry} from '../registry';

describe('Registry', () => {
    it('marks default optional components as unavailable', () => {
        expect(componentsRegistry.has('ChatPanel')).toBe(false);
        expect(componentsRegistry.has('HealthcheckAssistantAction')).toBe(false);
    });

    it('tracks placeholders explicitly instead of relying on entity names', () => {
        const placeholder = () => null;
        const registry = new Registry()
            .register('RequiredComponent', () => null)
            .registerPlaceholder('OptionalComponent', placeholder);

        expect(registry.has('RequiredComponent')).toBe(true);
        expect(registry.has('OptionalComponent')).toBe(false);
        expect(registry.get('OptionalComponent')).toBe(placeholder);

        registry.set('OptionalComponent', function EmptyPlaceholder() {
            return null;
        });

        expect(registry.has('OptionalComponent')).toBe(true);
    });
});
