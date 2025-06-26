type RegistryEntity<T = any> = T;
type RegistryEntities = Record<string, RegistryEntity>;

export class Registry<Entities extends RegistryEntities = {}> {
    type?: Entities;

    private entities: any = {};

    set<Id extends keyof Entities>(id: Id, entity: Entities[Id]) {
        this.entities[id] = entity;

        return this;
    }

    get<Id extends keyof Entities>(id: Id) {
        return this.entities[id];
    }

    has<Id extends keyof Entities>(id: Id): boolean {
        const entity = this.entities[id];
        return entity && entity.name !== 'EmptyPlaceholder';
    }

    register<Id extends string, T>(id: Id, entity: T): Registry<Entities & {[key in Id]: T}> {
        this.entities[id] = entity;

        return this;
    }
}

type ComponentType<T> =
    T extends React.ComponentType<any>
        ? React.ComponentType<React.ComponentPropsWithoutRef<T>>
        : never;

export interface ComponentsRegistryTemplate<T extends Registry, Entities = NonNullable<T['type']>> {
    set<Id extends keyof Entities>(id: Id, entity: ComponentType<Entities[Id]>): this;
    get<Id extends keyof Entities>(id: Id): ComponentType<Entities[Id]>;
    has<Id extends keyof Entities>(id: Id): boolean;
}
