// 内联语法高亮 Worker — 无任何外部 import，Turbopack 打包无依赖
// 使用 type: "module" 由 Turbopack 正确处理

const LANG_DEFS: Record<string, any> = {
  js: {
    keywords: "async await break case catch class const continue debugger default delete do else enum export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield".split(" "),
    patterns: [
      [/\/\/.*/, "comment"],
      [/\/\*[\s\S]*?\*\//, "comment"],
      [/"[^"]*"/, "string"],
      [/`[^`]*`/, "string"],
      [/'[^']*'/, "string"],
      [/\b(0[xX][\da-f]+|0[bB][01]+|0[oO][0-7]+)\b/, "number"],
      [/\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, "number"],
    ],
  },
  py: {
    keywords: "and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" "),
    patterns: [
      [/#.*/, "comment"],
      [/"""/, "string"],
      [/'''/, "string"],
      [/"[^"]*"/, "string"],
      [/'[^']*'/, "string"],
      [/\b(0[xX][\da-f]+|0[bB][01]+|0[oO][0-7]+)\b/, "number"],
      [/\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, "number"],
      [/@\w+/, "decorator"],
    ],
  },
  html: {
    patterns: [
      [/<!--[\s\S]*?-->/, "comment"],
      [/<\/?[\w-]+(?:\s[^>]*)?\/?>/, "tag"],
      [/"[^"]*"/, "string"],
      [/'[^']*'/, "string"],
    ],
  },
  css: {
    patterns: [
      [/\/\*[\s\S]*?\*\//, "comment"],
      [/@\w+(?:[^{};]*[;{])/, "atrule"],
      [/\.?[\w-]+(?=\s*\{)/, "class-name"],
      [/#[0-9a-fA-F]{3,8}\b/, "number"],
      [/"[^"]*"/, "string"],
      [/'[^']*'/, "string"],
    ],
  },
};

const LANG_ALIAS: Record<string, string> = {
  javascript: "js", jsx: "js", mjs: "js", cjs: "js", es6: "js",
  typescript: "js", tsx: "js", ts: "js",
  python: "py", rust: "py", rs: "py", go: "py", java: "py", cpp: "py",
  c: "py", csharp: "py", cs: "py", php: "py", ruby: "py", rb: "py",
  swift: "py", kotlin: "py", kt: "py", scala: "py", dart: "py",
  sql: "py", sh: "py", bash: "py", zsh: "py", shell: "py",
  yaml: "py", yml: "py", toml: "py", ini: "py", json: "py",
  md: "py", markdown: "py", text: "py", txt: "py",
  html: "html", htm: "html", xhtml: "html", xml: "html", svg: "html",
  css: "css", scss: "css", sass: "css", less: "css",
};

function resolveLang(name: string) {
  return LANG_DEFS[name] || LANG_DEFS[LANG_ALIAS[name]] || null;
}

interface Token {
  content: string;
  types: string[];
}

onmessage = (e: MessageEvent) => {
  const { code, language, id } = e.data;

  try {
    const def = resolveLang(language);
    if (!def) {
      const plain = code.split("\n").map((l: string) => l ? [{ content: l, types: [] } as Token] : []);
      postMessage({ id, lines: plain, success: true });
      return;
    }

    const keywordSet: Record<string, boolean> = {};
    if (def.keywords) def.keywords.forEach((k: string) => { keywordSet[k] = true; });

    const lines = code.split("\n");
    const resultLines: Token[][] = [];

    for (const line of lines) {
      const tokens: Token[] = [];
      let pos = 0;

      while (pos < line.length) {
        let matched = false;

        // Try regex patterns first
        if (def.patterns) {
          for (const [re, type] of def.patterns) {
            (re as RegExp).lastIndex = 0;
            const m = (re as RegExp).exec(line.substring(pos));
            if (m && m.index === 0) {
              tokens.push({ content: m[0], types: [type as string] });
              pos += m[0].length;
              matched = true;
              break;
            }
          }
          if (matched) continue;
        }

        const ch = line[pos];

        // Word
        if (/[a-zA-Z_]/.test(ch)) {
          let word = "";
          while (pos < line.length && /[a-zA-Z0-9_]/.test(line[pos])) {
            word += line[pos];
            pos++;
          }
          if (keywordSet[word]) {
            tokens.push({ content: word, types: ["keyword"] });
          } else {
            // Check if followed by ( → function
            if (line.substring(pos).trim().startsWith("(")) {
              tokens.push({ content: word, types: ["function"] });
            } else {
              tokens.push({ content: word, types: [] });
            }
          }
        }
        // Number
        else if (/\d/.test(ch)) {
          let num = "";
          while (pos < line.length && /[0-9a-fA-F.xXbBoO]/.test(line[pos])) {
            num += line[pos];
            pos++;
          }
          tokens.push({ content: num, types: ["number"] });
        }
        // String (already handled by patterns, but catch edge cases)
        else if (/["'`]/.test(ch)) {
          const quote = ch;
          let str = quote;
          pos++;
          while (pos < line.length) {
            if (line[pos] === "\\") { str += line[pos]; pos++; if (pos < line.length) { str += line[pos]; pos++; } }
            else if (line[pos] === quote) { str += quote; pos++; break; }
            else { str += line[pos]; pos++; }
          }
          tokens.push({ content: str, types: ["string"] });
        }
        // Operator
        else if (/[-+*\/%=<>!&|^~?:]/.test(ch)) {
          let op = ch;
          pos++;
          if (pos < line.length && /[-+*\/%=<>!&|^~?]/.test(line[pos])) { op += line[pos]; pos++; }
          if (pos < line.length && line[pos] === "=") { op += "="; pos++; }
          tokens.push({ content: op, types: ["operator"] });
        }
        // Punctuation
        else if (/[{}[\]();,.]/.test(ch)) {
          tokens.push({ content: ch, types: ["punctuation"] });
          pos++;
        }
        // Whitespace and others
        else {
          tokens.push({ content: ch, types: [] });
          pos++;
        }
      }

      resultLines.push(tokens);
    }

    // 分块发送，每块 CHUNK_SIZE 行，避免单次 postMessage 触发大规模 React re-render
    const CHUNK_SIZE = 3;
    for (let i = 0; i < resultLines.length; i += CHUNK_SIZE) {
      const chunk = resultLines.slice(i, i + CHUNK_SIZE);
      postMessage({ id, lines: chunk, offset: i, success: true });
    }
  } catch (err: any) {
    const fallback = code.split("\n").map((l: string) => l ? [{ content: l, types: [] } as Token] : []);
    // fallback 也分块
    const CHUNK_SIZE = 3;
    for (let i = 0; i < fallback.length; i += CHUNK_SIZE) {
      postMessage({ id, lines: fallback.slice(i, i + CHUNK_SIZE), offset: i, success: true });
    }
  }
};
