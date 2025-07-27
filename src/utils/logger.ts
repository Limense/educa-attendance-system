/**
 * =============================================
 * LOGGER UTILITY - SISTEMA DE LOGGING EMPRESARIAL
 * =============================================
 * 
 * Descripción: Implementa un sistema de logging robusto y escalable
 * 
 * Principios SOLID aplicados:
 * - S: Single Responsibility - Solo maneja operaciones de logging
 * - O: Open/Closed - Extensible para nuevos transportes
 * - L: Liskov Substitution - Diferentes niveles intercambiables
 * - I: Interface Segregation - Interfaces específicas por funcionalidad
 * - D: Dependency Inversion - Depende de abstracciones
 * 
 * Patrones de diseño:
 * - Strategy Pattern - Para diferentes destinos de logs
 * - Observer Pattern - Para múltiples listeners
 * - Factory Pattern - Para crear instancias de logger
 * - Singleton Pattern - Para configuración global
 */

/**
 * Niveles de logging disponibles
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

/**
 * Estructura de un log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
  requestId?: string;
  userId?: string;
  organizationId?: string;
}

/**
 * Configuración del logger
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  maxFileSize: number;
  maxFiles: number;
  remoteEndpoint?: string;
  environment: 'development' | 'production' | 'test';
}

/**
 * Interface para transportes de logging
 * Implementa Strategy Pattern
 */
export interface ILogTransport {
  log(entry: LogEntry): Promise<void>;
  isEnabled(): boolean;
  getName(): string;
}

/**
 * Interface para formatters de logs
 */
export interface ILogFormatter {
  format(entry: LogEntry): string;
}

/**
 * Transport para logging en consola
 */
export class ConsoleTransport implements ILogTransport {
  constructor(private enabled: boolean = true) {}

  async log(entry: LogEntry): Promise<void> {
    if (!this.enabled) return;

    const formatted = this.formatForConsole(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getName(): string {
    return 'Console';
  }

  /**
   * Formatea el log para visualización en consola con colores
   */
  private formatForConsole(entry: LogEntry): string {
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      FATAL: '\x1b[35m', // Magenta
      RESET: '\x1b[0m'   // Reset
    };

    const color = colors[entry.levelName as keyof typeof colors] || colors.RESET;
    const timestamp = new Date(entry.timestamp).toLocaleString();
    
    let formatted = `${color}[${timestamp}] ${entry.levelName}${colors.RESET}`;
    
    if (entry.context) {
      formatted += ` [${entry.context}]`;
    }
    
    formatted += `: ${entry.message}`;
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formatted += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }
    
    if (entry.stack) {
      formatted += `\n  Stack: ${entry.stack}`;
    }
    
    return formatted;
  }
}

/**
 * Transport para logging en archivos
 */
export class FileTransport implements ILogTransport {
  constructor(
    private enabled: boolean = false,
    private filePath: string = './logs/app.log'
  ) {}

  async log(entry: LogEntry): Promise<void> {
    if (!this.enabled) return;

    // En un entorno real, aquí se escribiría al archivo
    // Por ahora simulamos con console para el ejemplo
    const formatted = JSON.stringify(entry, null, 2);
    console.log(`[FILE LOG] ${formatted}`);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getName(): string {
    return 'File';
  }
}

/**
 * Transport para logging remoto
 */
export class RemoteTransport implements ILogTransport {
  constructor(
    private enabled: boolean = false,
    private endpoint?: string
  ) {}

  async log(entry: LogEntry): Promise<void> {
    if (!this.enabled || !this.endpoint) return;

    try {
      // En un entorno real, aquí se enviaría al endpoint
      // Por ahora simulamos la operación
      await this.sendToRemote(entry);
    } catch (error) {
      // Fallar silenciosamente para no romper la aplicación
      console.error('Error enviando log al servidor remoto:', error);
    }
  }

  isEnabled(): boolean {
    return this.enabled && !!this.endpoint;
  }

  getName(): string {
    return 'Remote';
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    // Simulación de envío remoto
    console.log(`[REMOTE LOG] Enviando a ${this.endpoint}:`, entry);
  }
}

/**
 * Configuración por defecto del logger
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  enableRemote: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  environment: 'development'
};

/**
 * Singleton para la configuración global del logger
 */
export class LoggerConfiguration {
  private static instance: LoggerConfiguration;
  private config: LoggerConfig;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadFromEnvironment();
  }

  public static getInstance(): LoggerConfiguration {
    if (!LoggerConfiguration.instance) {
      LoggerConfiguration.instance = new LoggerConfiguration();
    }
    return LoggerConfiguration.instance;
  }

  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Carga configuración desde variables de entorno
   */
  private loadFromEnvironment(): void {
    if (typeof window === 'undefined') {
      // Solo en servidor (Node.js)
      const env = process.env;
      
      if (env.LOG_LEVEL) {
        this.config.level = this.parseLogLevel(env.LOG_LEVEL);
      }
      
      if (env.LOG_ENABLE_CONSOLE) {
        this.config.enableConsole = env.LOG_ENABLE_CONSOLE === 'true';
      }
      
      if (env.LOG_ENABLE_FILE) {
        this.config.enableFile = env.LOG_ENABLE_FILE === 'true';
      }
      
      if (env.LOG_ENABLE_REMOTE) {
        this.config.enableRemote = env.LOG_ENABLE_REMOTE === 'true';
      }
      
      if (env.LOG_REMOTE_ENDPOINT) {
        this.config.remoteEndpoint = env.LOG_REMOTE_ENDPOINT;
      }
      
      if (env.NODE_ENV) {
        this.config.environment = env.NODE_ENV as 'development' | 'production' | 'test';
      }
    }
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'FATAL': return LogLevel.FATAL;
      default: return LogLevel.INFO;
    }
  }
}

/**
 * Clase principal del Logger
 * Implementa múltiples patrones de diseño para máxima flexibilidad
 */
export class Logger {
  private transports: ILogTransport[] = [];
  private context: string;
  private config: LoggerConfig;
  private requestId?: string;
  private userId?: string;
  private organizationId?: string;

  /**
   * Constructor del Logger
   * 
   * @param context - Contexto o nombre del módulo que usa el logger
   * 
   * @example
   * ```typescript
   * const logger = new Logger('AuthService');
   * logger.info('Usuario autenticado', { userId: '123' });
   * ```
   */
  constructor(context: string = 'Application') {
    this.context = context;
    this.config = LoggerConfiguration.getInstance().getConfig();
    this.initializeTransports();
  }

  /**
   * Establece el ID de request para trazabilidad
   */
  public setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Establece el ID de usuario para contexto
   */
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Establece el ID de organización para contexto
   */
  public setOrganizationId(organizationId: string): void {
    this.organizationId = organizationId;
  }

  /**
   * Log de nivel DEBUG
   * 
   * @param message - Mensaje a loggear
   * @param metadata - Datos adicionales
   * 
   * @example
   * ```typescript
   * logger.debug('Iniciando validación', { email: 'user@example.com' });
   * ```
   */
  public debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log de nivel INFO
   * 
   * @param message - Mensaje a loggear
   * @param metadata - Datos adicionales
   * 
   * @example
   * ```typescript
   * logger.info('Usuario autenticado exitosamente', { userId: '123' });
   * ```
   */
  public info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log de nivel WARN
   * 
   * @param message - Mensaje a loggear
   * @param metadata - Datos adicionales
   * 
   * @example
   * ```typescript
   * logger.warn('Token próximo a expirar', { expiresIn: '5 minutes' });
   * ```
   */
  public warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log de nivel ERROR
   * 
   * @param message - Mensaje a loggear
   * @param error - Error object opcional
   * @param metadata - Datos adicionales
   * 
   * @example
   * ```typescript
   * logger.error('Error en autenticación', error, { email: 'user@example.com' });
   * ```
   */
  public error(message: string, errorOrMetadata?: Error | Record<string, unknown>, metadata?: Record<string, unknown>): void {
    let finalMetadata = metadata || {};
    let stack: string | undefined;

    if (errorOrMetadata instanceof Error) {
      stack = errorOrMetadata.stack;
      finalMetadata = { ...finalMetadata, errorMessage: errorOrMetadata.message };
    } else if (errorOrMetadata) {
      finalMetadata = { ...finalMetadata, ...errorOrMetadata };
    }

    this.log(LogLevel.ERROR, message, finalMetadata, stack);
  }

  /**
   * Log de nivel FATAL
   * 
   * @param message - Mensaje a loggear
   * @param error - Error object opcional
   * @param metadata - Datos adicionales
   */
  public fatal(message: string, errorOrMetadata?: Error | Record<string, unknown>, metadata?: Record<string, unknown>): void {
    let finalMetadata = metadata || {};
    let stack: string | undefined;

    if (errorOrMetadata instanceof Error) {
      stack = errorOrMetadata.stack;
      finalMetadata = { ...finalMetadata, errorMessage: errorOrMetadata.message };
    } else if (errorOrMetadata) {
      finalMetadata = { ...finalMetadata, ...errorOrMetadata };
    }

    this.log(LogLevel.FATAL, message, finalMetadata, stack);
  }

  /**
   * Método principal de logging
   */
  private async log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    stack?: string
  ): Promise<void> {
    // Verificar si el nivel está habilitado
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level],
      message,
      context: this.context,
      metadata,
      stack,
      requestId: this.requestId,
      userId: this.userId,
      organizationId: this.organizationId
    };

    // Enviar a todos los transports habilitados
    const promises = this.transports
      .filter(transport => transport.isEnabled())
      .map(transport => transport.log(entry));

    try {
      await Promise.all(promises);
    } catch (error) {
      // Fallar silenciosamente para no afectar la aplicación
      console.error('Error en sistema de logging:', error);
    }
  }

  /**
   * Inicializa los transports basado en la configuración
   */
  private initializeTransports(): void {
    this.transports = [
      new ConsoleTransport(this.config.enableConsole),
      new FileTransport(this.config.enableFile),
      new RemoteTransport(this.config.enableRemote, this.config.remoteEndpoint)
    ];
  }

  /**
   * Agrega un transport personalizado
   */
  public addTransport(transport: ILogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Remueve un transport por nombre
   */
  public removeTransport(transportName: string): void {
    this.transports = this.transports.filter(t => t.getName() !== transportName);
  }

  /**
   * Crea un logger hijo con contexto adicional
   * 
   * @param childContext - Contexto adicional
   * @returns Nuevo logger con contexto combinado
   * 
   * @example
   * ```typescript
   * const serviceLogger = new Logger('UserService');
   * const methodLogger = serviceLogger.child('createUser');
   * methodLogger.info('Creando usuario'); // [UserService:createUser] Creando usuario
   * ```
   */
  public child(childContext: string): Logger {
    const childLogger = new Logger(`${this.context}:${childContext}`);
    childLogger.requestId = this.requestId;
    childLogger.userId = this.userId;
    childLogger.organizationId = this.organizationId;
    return childLogger;
  }

  /**
   * Crea un logger con contexto de request
   * 
   * @param requestId - ID único del request
   * @param userId - ID del usuario (opcional)
   * @param organizationId - ID de la organización (opcional)
   * @returns Logger configurado para el request
   */
  public withRequest(requestId: string, userId?: string, organizationId?: string): Logger {
    const requestLogger = new Logger(this.context);
    requestLogger.setRequestId(requestId);
    if (userId) requestLogger.setUserId(userId);
    if (organizationId) requestLogger.setOrganizationId(organizationId);
    return requestLogger;
  }
}

/**
 * Factory para crear loggers
 * Implementa Factory Pattern
 */
export class LoggerFactory {
  /**
   * Crea un logger para un contexto específico
   */
  public static create(context: string): Logger {
    return new Logger(context);
  }

  /**
   * Crea un logger para un request específico
   */
  public static createForRequest(
    context: string,
    requestId: string,
    userId?: string,
    organizationId?: string
  ): Logger {
    const logger = new Logger(context);
    logger.setRequestId(requestId);
    if (userId) logger.setUserId(userId);
    if (organizationId) logger.setOrganizationId(organizationId);
    return logger;
  }
}

/**
 * Exporta una instancia por defecto para uso rápido
 */
export const defaultLogger = new Logger('Application');

/**
 * Helper para generar IDs únicos de request
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Configurar el logger globalmente
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  LoggerConfiguration.getInstance().updateConfig(config);
}
