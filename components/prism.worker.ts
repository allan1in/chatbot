// Web Worker: 在后台线程中运行 Prism 分词，不阻塞主线程
// 接收主线程消息 { code, language, id }
// 返回 { id, lines, success, error? }

import Prism from "prismjs";

// 预加载常用语言
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup"; // HTML/SVG
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-java";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-php";

// 展平后的 token 结构
interface FlatToken {
  content: string;
  types: string[];
}

// 递归展平 Prism token，支持嵌套 (alias 语言等)
function flattenToken(
  token: string | Prism.Token,
  inheritedTypes: string[] = [],
): FlatToken[] {
  if (typeof token === "string") {
    return token.length > 0 ? [{ content: token, types: inheritedTypes }] : [];
  }

  const types = [...inheritedTypes, token.type];
  const result: FlatToken[] = [];

  if (typeof token.content === "string") {
    if (token.content.length > 0) {
      result.push({ content: token.content, types });
    }
  } else if (Array.isArray(token.content)) {
    for (const child of token.content) {
      result.push(...flattenToken(child, types));
    }
  }

  return result;
}

// 将展平的 token 数组按换行符拆分为行
function splitToLines(tokens: FlatToken[]): FlatToken[][] {
  const lines: FlatToken[][] = [];
  let currentLine: FlatToken[] = [];

  for (const token of tokens) {
    const parts = token.content.split("\n");
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        lines.push(currentLine);
        currentLine = [];
      }
      currentLine.push({ content: parts[i], types: token.types });
    }
  }
  lines.push(currentLine);

  return lines;
}

self.onmessage = (e: MessageEvent) => {
  const { code, language, id } = e.data;

  try {
    const grammar = Prism.languages[language];
    if (!grammar) {
      // 没有对应语法时，直接返回原始文本
      const lines: FlatToken[][] = code.split("\n").map((line: string) =>
        line.length > 0 ? [{ content: line, types: [] }] : [],
      );
      self.postMessage({ id, lines, success: true });
      return;
    }

    // Prism.tokenize 是纯同步操作，放在 Worker 里跑就不会阻塞主线程
    const rawTokens = Prism.tokenize(code, grammar);

    // 递归展平
    const flat: FlatToken[] = [];
    for (const token of rawTokens) {
      flat.push(...flattenToken(token));
    }

    // 按行分割
    const lines = splitToLines(flat);

    self.postMessage({ id, lines, success: true });
  } catch (error: any) {
    self.postMessage({
      id,
      error: error.message || String(error),
      success: false,
    });
  }
};
