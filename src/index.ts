import winston from "winston";

import { serializeErrorObj } from "./utils/serialize-error-obj";
import { customStringify } from "./custom-stringfy";
import { LoggerOptions } from "./logger-options";

const DEFAULTS: Required<LoggerOptions> = {
  context: "",
  logLevel: "info",
  visibleChars: 4,
  maxMaskedChars: 8,
  maxLogValueLength: 100,
  maximumDepth: 4,
  maximumBreadth: 50,
  circularValue: "Circular",
  deterministic: false,
  service: "",
  blackList: [],
  developmentFormat: false,
};

interface LogExtra {
  [key: string]: any;
}

interface LogTemplate {
  start: (extra?: LogExtra) => void;
  success: (extra?: LogExtra) => void;
  error: (extra?: LogExtra) => void;
  notFound: (resource: string, extra?: LogExtra) => void;
}

export class LoggerService {
  private readonly winstonLogger: winston.Logger;

  private SENSITIVE_FIELDS: Array<string> = [];

  private options: LoggerOptions;

  private contextName: string = "";

  private defaultExtra: LogExtra = {};

  public constructor(options?: Partial<LoggerOptions>) {
    this.options = { ...DEFAULTS, ...options };
    this.contextName = this.options.context;
    this.SENSITIVE_FIELDS = this.options.blackList;
    this.winstonLogger = this.createWinstonLogger();
  }

  public setContext(contextName: string): void {
    this.contextName = contextName;
  }

  public setDefaultExtra(extra: LogExtra): void {
    this.defaultExtra = { ...this.defaultExtra, ...extra };
  }

  public setExtra(extra: LogExtra): void {
    this.defaultExtra = extra;
  }

  public setBlackList(blackList: Array<string>) {
    this.SENSITIVE_FIELDS = blackList;
  }

  private mergeExtra(extra?: LogExtra): LogExtra {
    const baseExtra = { ...this.defaultExtra, ...extra };

    return baseExtra;
  }

  private formatMessage(message: string): string {
    return `${this.contextName}: ${message}`;
  }

  private logSafely(
    logFn: (message: string, meta?: any) => void,
    message: string,
    extra?: LogExtra
  ): void {
    try {
      const stringify = customStringify({
        maximumDepth: this.options.maximumDepth,
        maximumBreadth: this.options.maximumBreadth,
        circularValue: this.options.circularValue,
        deterministic: this.options.deterministic,
      });

      let serializedObj = extra;

      if (extra !== undefined) {
        const serializedString =
          stringify(extra, (_key: string, value: unknown) =>
            serializeErrorObj(value)
          ) ?? "{}";

        serializedObj = JSON.parse(serializedString);
      }

      const mergedExtra = this.mergeExtra(serializedObj);

      logFn(
        this.formatMessage(message),
        this.maskAndTruncateSensitiveData(mergedExtra)
      );
    } catch (error) {
      this.winstonLogger.error("Logging error:", error);
    }
  }

  public debug(message: string, extra?: LogExtra): void {
    this.logSafely(
      this.winstonLogger.debug.bind(this.winstonLogger),
      message,
      extra
    );
  }

  public info(message: string, extra?: LogExtra): void {
    this.logSafely(
      this.winstonLogger.info.bind(this.winstonLogger),
      message,
      extra
    );
  }

  public warn(message: string, extra?: LogExtra): void {
    this.logSafely(
      this.winstonLogger.warn.bind(this.winstonLogger),
      message,
      extra
    );
  }

  public error(message: string, extra?: LogExtra): void {
    this.logSafely(
      this.winstonLogger.error.bind(this.winstonLogger),
      message,
      extra
    );
  }

  public get tmpl(): LogTemplate {
    return {
      start: (extra?: LogExtra) => this.info("Execution started", extra),
      success: (extra?: LogExtra) => this.info("Executed successfully", extra),
      error: (extra?: LogExtra) => this.error("Execution failed", extra),
      notFound: (resource: string, extra?: LogExtra) =>
        this.error(`Failed to find ${resource}`, extra),
    };
  }

  private maskSensitiveValue = (value: unknown): string | null | undefined => {
    if (value === null) return null;

    const stringValue = String(value);

    if (
      stringValue.length <= this.options.visibleChars ||
      this.options.visibleChars === 0
    ) {
      return "*".repeat(stringValue.length);
    }

    const maskedChars = Math.min(
      stringValue.length - this.options.visibleChars,
      this.options.maxMaskedChars
    );
    return (
      "*".repeat(maskedChars) + stringValue.slice(-this.options.visibleChars)
    );
  };

  private isSensitiveField = (key: string): boolean =>
    this.SENSITIVE_FIELDS.some((field) =>
      key.toLowerCase().includes(field.toLowerCase())
    );

  private truncateValue = (value: unknown): unknown => {
    if (value == null) return value;

    if (
      typeof value === "string" &&
      value.length > this.options.maxLogValueLength
    ) {
      return `${value.slice(0, this.options.maxLogValueLength - 3)}...`;
    }

    return value;
  };

  private maskAndTruncateSensitiveData = (obj: unknown): unknown => {
    if (obj == null || typeof obj !== "object") return this.truncateValue(obj);

    if (Array.isArray(obj)) {
      return obj.map(this.maskAndTruncateSensitiveData);
    }

    const masked = { ...(obj as Record<string, unknown>) };

    Object.keys(masked).forEach((key) => {
      if (this.isSensitiveField(key)) {
        masked[key] = this.maskSensitiveValue(masked[key]);
      } else if (typeof masked[key] === "object") {
        masked[key] = this.maskAndTruncateSensitiveData(masked[key]);
      } else {
        masked[key] = this.truncateValue(masked[key]);
      }
    });

    return masked;
  };

  private createWinstonLogger = (): winston.Logger => {
    const baseFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const developmentFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    );

    return winston.createLogger({
      level: process.env.LOG_LEVEL || this.options.logLevel,
      format: baseFormat,
      defaultMeta: { service: this.options.service },
      transports: [
        new winston.transports.Console({
          format: this.options.developmentFormat
            ? developmentFormat
            : baseFormat,
        }),
      ],
    });
  };
}
