export function prismaCreateAdapter<T>(thing: T | undefined) {
    return thing ?? null;
}

export function prismaGetAdapter<T>(thing: T | null) {
    return thing ?? undefined;
}
