export interface SlotComponent<Props = {}, Type = never>
    extends React.FC<Props & {ref?: React.Ref<Type>}> {
    /**
     * @internal
     */
    __slotName: string;
}

export interface SlotItem<Props = {}, Type = unknown> {
    name: string;
    props: Props;
    ref?: React.Ref<Type>;
    rendered: ExtractChildrenType<Props>;
}

type ExtractChildrenType<Props> = Props extends {children: infer Children}
    ? Children
    : Props extends {children?: infer Children}
      ? Children | undefined
      : never;
