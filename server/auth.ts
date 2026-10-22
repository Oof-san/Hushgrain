import { scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { SignJWT, jwtVerify } from 'jose';
import type { Request } from 'express';
const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = 'hushgrain_owner';
export function authConfigured() {
  return Boolean(
    process.env.ADMIN_PASSWORD_HASH && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32,
  );
}
export async function verifyPassword(password: string) {
  if (!authConfigured()) return false;
  const [method, salt, hash] = process.env.ADMIN_PASSWORD_HASH!.split(':');
  if (method !== 'scrypt' || !salt || !/^[a-f0-9]{128}$/.test(hash ?? '')) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
function key() {
  return new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET);
}
export async function createSession() {
  return new SignJWT({ role: 'owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('cafe-owner')
    .setIssuer('hushgrain')
    .setAudience('hushgrain-owner')
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key());
}
export async function isOwner(req: Request) {
  if (!authConfigured()) return false;
  const token = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key(), {
      issuer: 'hushgrain',
      audience: 'hushgrain-owner',
      algorithms: ['HS256'],
    });
    return payload.role === 'owner';
  } catch {
    return false;
  }
}
