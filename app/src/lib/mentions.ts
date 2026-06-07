/**
 * @mention parsing utilities
 * Extracts @username patterns from text and resolves them to user IDs.
 * Supports English, Chinese, digits, and underscores in usernames.
 */

const MENTION_REGEX = /@([\w\u4e00-\u9fff\u3400-\u4dbf]+)/g;

export interface ParsedMention {
  username: string;
  index: number; // position in original text
}

export interface ResolvedMention {
  username: string;
  userId: string;
}

/**
 * Extract all @username mentions from text.
 * Returns deduplicated list with position info.
 */
export function parseMentions(text: string): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  // Reset regex state
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const username = match[1];
    if (!seen.has(username)) {
      seen.add(username);
      mentions.push({ username, index: match.index });
    }
  }
  return mentions;
}

/**
 * Build a case-insensitive username → userId map from app_users array.
 */
export function buildUserMap(
  users: { id: string; username: string }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const u of users) {
    map.set(u.username.toLowerCase(), u.id);
  }
  return map;
}

/**
 * Resolve parsed mentions against a user map.
 * Returns only mentions that match valid users.
 */
export function resolveMentions(
  mentions: ParsedMention[],
  userMap: Map<string, string>
): ResolvedMention[] {
  const resolved: ResolvedMention[] = [];
  const seen = new Set<string>();

  for (const m of mentions) {
    const userId = userMap.get(m.username.toLowerCase());
    if (userId && !seen.has(userId)) {
      seen.add(userId);
      resolved.push({ username: m.username, userId });
    }
  }
  return resolved;
}
