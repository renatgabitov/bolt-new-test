export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: any;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details: details ? this.sanitize(details) : undefined
    };

    if (details instanceof Error) {
      entry.stack = details.stack;
    }

    // Add to internal logs array
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Console output with styling
    const styles = {
      debug: 'color: #808080',
      info: 'color: #0066cc',
      warn: 'color: #ff9900',
      error: 'color: #cc0000; font-weight: bold'
    };

    console.log(
      `%c[${entry.timestamp}] ${level.toUpperCase()}: ${message}`,
      styles[level]
    );

    if (details) {
      console.log('Details:', details);
      if (entry.stack) {
        console.log('Stack trace:', entry.stack);
      }
    }
  }

  private sanitize(data: any): any {
    try {
      const seen = new WeakSet();
      return JSON.parse(JSON.stringify(data, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      }));
    } catch (error) {
      return '[Unable to serialize data]';
    }
  }

  debug(message: string, details?: any) {
    this.log('debug', message, details);
  }

  info(message: string, details?: any) {
    this.log('info', message, details);
  }

  warn(message: string, details?: any) {
    this.log('warn', message, details);
  }

  error(message: string, details?: any) {
    this.log('error', message, details);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();