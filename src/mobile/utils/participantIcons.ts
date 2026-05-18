const PARTICIPANT_ICON_POOL = ['😎', '🦊', '🐼', '🐯', '🦉', '🐙', '🐸', '🐧', '🐨', '🦁', '🐬', '🦄'] as const;

function hashName(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getDefaultParticipantIcon(displayName: string): string {
  const hash = hashName(displayName.trim().toLowerCase());
  return PARTICIPANT_ICON_POOL[hash % PARTICIPANT_ICON_POOL.length] ?? '😎';
}

export function getParticipantIconOptions(displayName: string): string[] {
  const hash = hashName(displayName.trim().toLowerCase());
  const options: string[] = [];
  const used = new Set<string>();
  for (let offset = 0; offset < PARTICIPANT_ICON_POOL.length && options.length < 6; offset += 1) {
    const icon = PARTICIPANT_ICON_POOL[(hash + offset * 3) % PARTICIPANT_ICON_POOL.length];
    if (used.has(icon)) {
      continue;
    }
    used.add(icon);
    options.push(icon);
  }
  return options;
}
