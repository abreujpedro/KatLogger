# 🐱 KatLogger

[![npm version](https://img.shields.io/npm/v/kat-logger.svg?color=blue)](https://www.npmjs.com/package/kat-logger)  
[![npm downloads](https://img.shields.io/npm/dm/kat-logger.svg?color=green)](https://www.npmjs.com/package/kat-logger)

A configurable logging library for **Node.js + TypeScript** that:

- Prevents **circular references** from breaking logs.
- Truncates long strings to avoid **overly large log entries**.
- Limits **object depth and breadth** for cleaner outputs.
- Masks or hides **sensitive values** (with blacklist support).
- Provides built-in **log templates** for common scenarios.
- Fully configurable (log level, context, output style, etc.).

---

## 🚀 Installation

Com **npm**:

```bash
npm install kat-logger
```

Com **yarn**:

```bash
yarn add kat-logger
```

## 🔧 Usage

```ts
import { LoggerService } from "kat-logger";

const logger = new LoggerService({
  context: "MyService",
  logLevel: "debug",
  visibleChars: 3,
  maxMaskedChars: 10,
  maxLogValueLength: 200,
  maximumDepth: 5,
  maximumBreadth: 100,
  circularValue: "Circular",
  deterministic: true,
  service: "teste",
  blackList: ["password"],
});

const x = { password: "mytext", test: {} };
x.test = x; // Circular reference

// Normal usage
logger.info("Starting process", { userId: 123, password: "123456", x });
logger.error("Error while processing request", { error: new Error("Failure") });

// Using templates
logger.tmpl.start({ task: "import" });
logger.tmpl.success({ task: "import" });
logger.tmpl.error({ task: "import" });
logger.tmpl.notFound("Resource", { id: 42 });
```

## ⚙️ Configuration Options

The `LoggerService` accepts the following options:

| Option              | Type     | Default      | Description                                                  |
| ------------------- | -------- | ------------ | ------------------------------------------------------------ |
| `context`           | string   | `""`         | Prefix used in log messages to identify the context/module.  |
| `logLevel`          | string   | `"info"`     | Minimum log level: `"debug"`, `"info"`, `"warn"`, `"error"`. |
| `visibleChars`      | number   | `4`          | Number of characters visible when masking sensitive values.  |
| `maxMaskedChars`    | number   | `8`          | Maximum number of masked characters.                         |
| `maxLogValueLength` | number   | `100`        | Maximum string length before truncation with `...`.          |
| `maximumDepth`      | number   | `4`          | Maximum depth for nested objects.                            |
| `maximumBreadth`    | number   | `50`         | Maximum number of properties per object level.               |
| `circularValue`     | string   | `"Circular"` | Replacement string for circular references.                  |
| `deterministic`     | boolean  | `false`      | Ensures consistent key ordering if `true`.                   |
| `service`           | string   | `""`         | Default service name used in meta.                           |
| `blackList`         | string[] | `[]`         | List of keys to mask in log outputs.                         |
| `developmentFormat` | boolean  | `false`      | Enables development-style formatting in log outputs.         |

## 📝 Log Templates

The logger includes ready-to-use templates for common situations:

| Template   | Usage Example                                  | Output                          |
| ---------- | ---------------------------------------------- | ------------------------------- |
| `start`    | `logger.tmpl.start({ task: "import" })`        | Logs `Execution started`.       |
| `success`  | `logger.tmpl.success({ task: "import" })`      | Logs `Executed successfully`.   |
| `error`    | `logger.tmpl.error({ task: "import" })`        | Logs `Execution failed`.        |
| `notFound` | `logger.tmpl.notFound("Resource", { id: 42 })` | Logs `Failed to find Resource`. |

## 📜 Example Log Output

### Normal Info Log

```json
{
  "level": "info",
  "message": "MyService: Starting process",
  "password": "123456",
  "service": "test",
  "timestamp": "2025-09-13T22:44:32.617Z",
  "userId": 123,
  "x": { "a": "Circular", "abc": "*****des" }
}
```

## 🔨 Methods

### `setContext(contextName: string): void`

Sets a **context name** for the logger instance.  
The context is automatically **prefixed** to every log message, helping identify the module or service where the log originated.

A common usage is to pass the class constructor name (e.g., in a **use case** or service class), so each class has its own log context automatically.

**Example:**

```ts
class CreateUserUseCase {
  private readonly logger = new LoggerService();

  constructor() {
    this.logger.setContext(this.constructor.name);
  }

  execute() {
    this.logger.info("Executing business logic...");
  }
}

new CreateUserUseCase().execute();

// Output:
{"level":"info","message":"CreateUserUseCase: Executing business logic...", ...}
```

### `setDefaultExtra(extra: LogExtra): void`

Merges new key/value pairs into the **default extra fields**.  
These fields are automatically added to every log message, unless overridden.  
If the same key already exists, it will be **overwritten** with the new value.

**Example:**

```ts
logger.setDefaultExtra({ app: "my-api", version: "1.2.0" });
logger.info("Server ready");

// Output:
{
  "level": "info",
  "message": "PaymentService: Server ready",
  "app": "my-api",
  "version": "1.2.0",
  ...
}
```
