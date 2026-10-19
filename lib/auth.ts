import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

export const COOKIE = "session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "");

export async function createSession(user: string) {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
}

export async function isAuthed() {
  if (!process.env.AUTH_SECRET) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}
