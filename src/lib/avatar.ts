import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/avataaars';

export function generateAvatarUrl(seed: string): string {
  const avatar = createAvatar(avataaars, {
    seed: seed,
    size: 128,
    radius: 50,
  });

  return avatar.toDataUri();
}

