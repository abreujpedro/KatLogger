export interface LoggerOptions {
  context: string;
  logLevel: string;
  visibleChars: number;
  maxMaskedChars: number;
  maxLogValueLength: number;
  maximumDepth: number;
  maximumBreadth: number;
  circularValue: string;
  deterministic: boolean;
  service: string;
  blackList: Array<string>;
}
