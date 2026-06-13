/**
 * @mention parsing utilities
 * Extracts @username patterns from text and resolves them to user IDs.
 * Supports English, Chinese, digits, underscores, and spaces in Chinese usernames.
 * Chinese usernames can contain spaces (e.g., "@刘 红") but English ones cannot.
 */

// Regex: Chinese pattern (allows spaces between Chinese chars) OR English pattern (no spaces)
const MENTION_REGEX = /@((?:[\u4e00-\u9fff\u3400-\u4dbf]+(?: [\u4e00-\u9fff\u3400-\u4dbf]+)*)|(?:[\w]+))/g;

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
 * Build a case-insensitive username → userId map from user_roles array.
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
 * For Chinese usernames with spaces, tries greedy match first,
 * then progressively truncates from the right if no match found.
 * e.g., "王 小明 你好" → try "王 小明 你好", then "王 小明", then "王"
 * Returns only mentions that match valid users.
 */
export function resolveMentions(
  mentions: ParsedMention[],
  userMap: Map<string, string>
): ResolvedMention[] {
  const resolved: ResolvedMention[] = [];
  const seen = new Set<string>();

  for (const m of mentions) {
    const username = m.username;

    // Direct lookup
    const userId = userMap.get(username.toLowerCase());
    if (userId && !seen.has(userId)) {
      seen.add(userId);
      resolved.push({ username, userId });
      continue;
    }

    // For Chinese usernames with spaces: try progressively shorter versions
    if (username.includes(" ")) {
      const parts = username.split(" ");
      // Try removing parts from the right
      for (let i = parts.length - 1; i >= 1; i--) {
        const shorter = parts.slice(0, i).join(" ");
        const shorterId = userMap.get(shorter.toLowerCase());
        if (shorterId && !seen.has(shorterId)) {
          seen.add(shorterId);
          resolved.push({ username: shorter, userId: shorterId });
          break;
        }
      }
    }
  }
  return resolved;
}
