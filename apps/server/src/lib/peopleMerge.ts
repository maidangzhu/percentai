import type { PrismaClient, Person } from "@prisma/client";

// 同时认半角 () 和全角 （），因为 WeChat 中文输入时常出全角
const PERSON_NAME_SUFFIX_RE = /\s*[(（]\d+[)）]\s*$/;
// 合并变体：去掉所有空白 + 常见分隔符（- – — ~ ），让"张三-3.24" / "张三 -3.24" / "张三3.24" 归一为同一 key。
// 不动中文逗号/句号/点 —— "Mr.Smith" vs "MrSmith" 不是同一回事。
const SEPARATOR_RE = /[\s\-–—~]+/g;

export function normalizePersonName(name: string): string {
  return name
    .replace(PERSON_NAME_SUFFIX_RE, "")
    .replace(SEPARATOR_RE, "")
    .trim();
}

function isVariantOf(candidate: Person, normalizedName: string) {
  return normalizePersonName(candidate.name) === normalizedName;
}

export async function mergeDuplicatePerson(
  duplicate: Person,
  target: Person,
  prisma: PrismaClient
) {
  if (duplicate.id === target.id) return;
  await prisma.chatTurn.updateMany({
    where: { personId: duplicate.id },
    data: { personId: target.id },
  });
  await prisma.task.updateMany({
    where: { personId: duplicate.id },
    data: { personId: target.id },
  });
  await prisma.person.delete({ where: { id: duplicate.id } });
}

export interface ResolvePersonOptions {
  prisma: PrismaClient;
  clientApp: string;
  rawName: string;
  generateId: () => string;
}

export async function resolveCanonicalPerson({
  prisma,
  clientApp,
  rawName,
  generateId,
}: ResolvePersonOptions): Promise<Person> {
  const normalized = normalizePersonName(rawName);
  if (!normalized) {
    throw new Error("person name is empty after normalization");
  }

  const candidates = await prisma.person.findMany({ where: { clientApp } });
  const variants = candidates.filter((candidate) => isVariantOf(candidate, normalized));

  if (variants.length === 0) {
    return prisma.person.create({
      data: { id: generateId(), name: normalized, clientApp },
    });
  }

  const exact = variants.find((variant) => variant.name === normalized);
  const canonical =
    exact ??
    variants
      .slice()
      .sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )[0];

  for (const variant of variants) {
    if (variant.id === canonical.id) continue;
    await mergeDuplicatePerson(variant, canonical, prisma);
  }

  if (canonical.name !== normalized) {
    return prisma.person.update({
      where: { id: canonical.id },
      data: { name: normalized, updatedAt: new Date() },
    });
  }

  return prisma.person.update({
    where: { id: canonical.id },
    data: { updatedAt: new Date() },
  });
}

/**
 * 启动时跑一遍：把所有 person 按 normalize 后的 key 分组，
 * 同 key 视为同一个人，merge 到最早创建的那条上。
 * 用于修复历史数据里 LLM 把同一个联系人写成不同写法留下的重复行。
 */
export async function dedupeAllPeopleOnStartup(
  prisma: PrismaClient
): Promise<{ scanned: number; merged: number }> {
  const all = await prisma.person.findMany();
  const groups = new Map<string, Person[]>();
  for (const p of all) {
    const key = normalizePersonName(p.name);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  let merged = 0;
  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    const canonical = group
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    for (const dup of group) {
      if (dup.id === canonical.id) continue;
      await mergeDuplicatePerson(dup, canonical, prisma);
      merged += 1;
    }
    if (canonical.name !== normalizePersonName(canonical.name)) {
      await prisma.person.update({
        where: { id: canonical.id },
        data: { name: normalizePersonName(canonical.name), updatedAt: new Date() },
      });
    }
  }
  return { scanned: all.length, merged };
}
