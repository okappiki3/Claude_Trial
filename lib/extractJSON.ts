export function extractJSON<T>(raw: string): T {
  let s = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSONが見つかりません");
  s = s.slice(start, end + 1);
  s = s.replace(/[\x00-\x1f]/g, (ch) => {
    if (ch === "\n") return "\\n";
    if (ch === "\r") return "";
    if (ch === "\t") return "\\t";
    return "";
  });
  return JSON.parse(s) as T;
}
