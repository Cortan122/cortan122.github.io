type PreprocessorEnvironment = {
  __FILE__?: string;
  [x: string]: {
    args?: string[];
    text: Token[];
    eval?: boolean;
  }|string;
};

type PreprocessorOptions = {
  keepNewlines?: boolean;
  headerFilePath?: string[];
};

type TokenType = "string" | "number" | "identifier" | "lineComment" | "blockComment" | "operator" | "char" | "newline";

type PrintErrorOptions = false | {
  lineStyle?: "none" | "simple" | "tabbed" | "highlighted" | "both";
  includeStack?: boolean;
  colors?: false | {
    error: string;
    warning: string;
    message: string;
    _header: string;
  };
};

type TokenOptions = {
  interpretSingleQuotedStringsAs?: "string" | "number" | "char";
  // printError?: false | PrintErrorOptions;
  filename?: string | false;
  comments?: boolean;
  newlines?: boolean;
  operators?: string[];
  lineCommentSymbol?: string;
};

type Token = {
  type: "string" | "number" | "char" | "identifier" | "lineComment" | "blockComment" | "operator" | "newline";
  string: string;
  loc: {
    file: string;
    end: {
      line: number;
      col: number;
      index: number;
    };
    start: {
      line: number;
      col: number;
      index: number;
    };
  };
  value?: number | Buffer;
  includeStack?: Token;
};

/*
type Token = {
  type: "identifier" | "lineComment" | "blockComment" | "operator" | "newline";
  string: string;
  loc: {
    file: string;
    end: {
      line: number;
      col: number;
      index: number;
    };
    start: {
      line: number;
      col: number;
      index: number;
    };
  };
  value?: number | Buffer;
} | {
  type: "string";
  string: string;
  loc: {
    file: string;
    end: {
      line: number;
      col: number;
      index: number;
    };
    start: {
      line: number;
      col: number;
      index: number;
    };
  };
  value: Buffer;
} | {
  type: "number";
  string: string;
  loc: {
    file: string;
    end: {
      line: number;
      col: number;
      index: number;
    };
    start: {
      line: number;
      col: number;
      index: number;
    };
  };
  value: number;
} | {
  type: "char";
  string: string;
  loc: {
    file: string;
    end: {
      line: number;
      col: number;
      index: number;
    };
    start: {
      line: number;
      col: number;
      index: number;
    };
  };
  value: number | Buffer;
};
*/
