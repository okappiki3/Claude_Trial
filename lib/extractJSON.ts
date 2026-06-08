function stripFences(raw: string): string {
  return raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
}

function sliceOutermost(raw: string): string {
  const start = raw.indexOf("{");
  if (start === -1) throw new Error("JSONが見つかりません");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  // 末尾が切れている場合はそのまま返してStage 3に任せる
  return raw.slice(start);
}

// Stage 1: 制御文字をエスケープしてそのままパース
function tryStage1(s: string): unknown {
  const escaped = s.replace(/[\x00-\x1f]/g, (ch) => {
    if (ch === "\n") return "\\n";
    if (ch === "\r") return "";
    if (ch === "\t") return "\\t";
    return "";
  });
  return JSON.parse(escaped);
}

// Stage 2: 文字列内の生の二重引用符をエスケープしながら走査して再パース
function tryStage2(s: string): unknown {
  const cleaned = s.replace(/[\x00-\x1f]/g, (ch) => {
    if (ch === "\n") return " ";
    if (ch === "\t") return " ";
    return "";
  });
  const out: string[] = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (!inString) {
      out.push(ch);
      if (ch === '"') {
        inString = true;
        escaped = false;
      }
      continue;
    }
    if (escaped) {
      out.push(ch);
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out.push(ch);
      escaped = true;
      continue;
    }
    if (ch === '"') {
      // 次の意味のある文字が , } ] : なら閉じ引用符として扱う、それ以外はエスケープ
      let j = i + 1;
      while (j < cleaned.length && /\s/.test(cleaned[j])) j++;
      const next = cleaned[j];
      if (next === "," || next === "}" || next === "]" || next === ":" || next === undefined) {
        out.push(ch);
        inString = false;
      } else {
        out.push("\\");
        out.push('"');
      }
      continue;
    }
    out.push(ch);
  }
  return JSON.parse(out.join(""));
}

// Stage 3: 末尾が切り詰められたJSONを自動補修する
function tryStage3(s: string): unknown {
  const cleaned = s.replace(/[\x00-\x1f]/g, (ch) => {
    if (ch === "\n") return "\\n";
    if (ch === "\r") return "";
    if (ch === "\t") return "\\t";
    return "";
  });
  // 末尾までの構造をスタックで追跡し、開いたままの string/array/object を閉じる
  const stack: ("{" | "[" | '"')[] = [];
  let escaped = false;
  let lastValueEnd = -1;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const top = stack[stack.length - 1];
    if (top === '"') {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        stack.pop();
        lastValueEnd = i;
      }
      continue;
    }
    if (ch === '"') {
      stack.push('"');
      continue;
    }
    if (ch === "{") {
      stack.push("{");
      continue;
    }
    if (ch === "[") {
      stack.push("[");
      continue;
    }
    if (ch === "}") {
      if (top === "{") stack.pop();
      lastValueEnd = i;
      continue;
    }
    if (ch === "]") {
      if (top === "[") stack.pop();
      lastValueEnd = i;
      continue;
    }
    if (/[0-9truefalsenul]/i.test(ch)) {
      lastValueEnd = i;
    }
  }
  // 文字列が開いたまま → 閉じる
  let truncated = cleaned;
  if (stack[stack.length - 1] === '"') {
    truncated += '"';
    stack.pop();
  }
  // 不完全なトークンを末尾から切り捨て
  truncated = truncated.replace(/[,:]\s*$/g, "");
  // 残るスタックを閉じる
  while (stack.length > 0) {
    const top = stack.pop();
    if (top === "{") truncated += "}";
    else if (top === "[") truncated += "]";
  }
  return JSON.parse(truncated);
  void lastValueEnd;
}

export function extractJSON<T>(raw: string): T {
  const sliced = sliceOutermost(stripFences(raw));
  const errors: string[] = [];
  for (const stage of [tryStage1, tryStage2, tryStage3]) {
    try {
      return stage(sliced) as T;
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  throw new Error(
    `JSONパース失敗: ${errors.join(" / ")} | head=${sliced.slice(0, 80)}`,
  );
}
