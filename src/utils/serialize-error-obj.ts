export function serializeErrorObj<T>(extra: T): T {
  if (extra instanceof Error) {
    return {
      ...extra,
      name: extra.name,
      message: extra.message,
      stack: extra.stack,
    };
  }

  return extra;
}
