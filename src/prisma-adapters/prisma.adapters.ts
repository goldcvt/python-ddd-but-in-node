export const prismaCreateAdapter = <T>(thing: T | undefined) => thing ?? null;
export const prismaGetAdapter = <T>(thing: T | null) => thing ?? undefined;
