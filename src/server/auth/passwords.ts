import { argon2id, hash, verify } from 'argon2';

export function hashPassword(password: string) {
  return hash(password, { type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export async function verifyPassword({ hash: passwordHash, password }: { hash: string; password: string }) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
