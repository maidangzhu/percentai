// 客户端 + 服务端共享的 task 标题相似度工具。纯函数，无外部依赖。

export function normalizeText(text: string | null | undefined) {
  return (text ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(
      /[，。！？、,.!?;；:：'"“”‘’`~\-_\[\]【】（）(){}<>《》]/g,
      ""
    )
    .replace(/[🔥✨⭐️❤❤️💖]/g, "")
    .toLowerCase();
}

function charBigrams(text: string) {
  if (!text) return new Set<string>();
  if (text.length === 1) return new Set([text]);
  const grams = new Set<string>();
  for (let index = 0; index < text.length - 1; index += 1) {
    grams.add(text.slice(index, index + 2));
  }
  return grams;
}

export function taskTitleSimilarity(left: string, right: string) {
  const a = charBigrams(normalizeText(left));
  const b = charBigrams(normalizeText(right));
  if (!a.size || !b.size) return 0;

  let intersection = 0;
  for (const gram of a) {
    if (b.has(gram)) intersection += 1;
  }

  return intersection / (a.size + b.size - intersection);
}
