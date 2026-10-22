import { scryptSync, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
const prompt = createInterface({ input: process.stdin, output: process.stdout });
const password = await prompt.question('Owner password (visible only in your local terminal): ');
prompt.close();
if (password.length < 12) {
  console.error('Use at least 12 characters.');
  process.exit(1);
}
const salt = randomBytes(24).toString('hex');
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(48).toString('hex')}`);
