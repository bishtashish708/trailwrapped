declare module "fit-file-parser" {
  export interface FitParserOptions {
    force?: boolean;
    mode?: "cascade" | "list" | "both" | "raw";
    speedUnit?: string;
    lengthUnit?: string;
    temperatureUnit?: string;
    elapsedRecordField?: boolean;
  }

  export default class FitParser {
    constructor(options?: FitParserOptions);
    parse(
      content: Buffer | ArrayBuffer,
      callback: (error: Error | null, data: unknown) => void
    ): void;
  }
}
