import stringify, { configure, StringifyOptions } from "safe-stable-stringify";

export const customStringify = (config: StringifyOptions): typeof stringify =>
  configure({
    circularValue: config.circularValue,
    deterministic: config.deterministic,
    maximumDepth: config.maximumDepth,
    maximumBreadth: config.maximumBreadth,
  });
