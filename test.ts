import { LoggerService } from "./src/index";

const logger = new LoggerService({
  context: "MyService",
  logLevel: "debug",
  visibleChars: 3,
  maxMaskedChars: 10,
  maxLogValueLength: 200,
  maximumDepth: 5,
  maximumBreadth: 100,
  circularValue: "[CircularRef]",
  deterministic: true,
  service: "teste",
  blackList: ["abc"],
});

const x = { abc: "saudades", a: {} };

x.a = x;

// Uso normal

logger.info("Iniciando processo", { userId: 123, password: "123456", x });
logger.error("Erro ao processar requisição", { error: new Error("Falha") });

// Usando template
logger.tmpl.start({ task: "import" });
logger.tmpl.success({ task: "import" });
logger.tmpl.notFound("Resource", { id: 42 });
