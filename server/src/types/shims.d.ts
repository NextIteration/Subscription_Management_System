// Ambient module declarations for external libraries that may not yet be installed in node_modules

declare module 'node-cron' {
  export interface ScheduledTask {
    start(): this;
    stop(): this;
    destroy(): void;
    getStatus(): string;
  }
  export function schedule(
    cronExpression: string,
    func: () => void | Promise<void>,
    options?: any
  ): ScheduledTask;
  const cron: {
    schedule: typeof schedule;
  };
  export default cron;
}

declare module 'pdfkit' {
  class PDFDocument {
    constructor(options?: any);
    [key: string]: any;
  }
  namespace PDFKit {
    type PDFDocument = any;
  }
  export = PDFDocument;
}

declare namespace PDFKit {
  type PDFDocument = any;
}
