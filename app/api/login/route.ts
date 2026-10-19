import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { COOKIE, createSession } from "../../../lib/auth";

const safeEq = (a: string, b: string) => {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { username?: string; password?: string };
  const username = (body.username || "").trim();
  const password = body.password || "";

  if (!process.env.AUTH_SECRET || !process.env.AUTH_USERS) {
    return NextResponse.json({ error: "Server par AUTH_SECRET / AUTH_USERS set nahi hai" }, { status: 500 });
  }

  // AUTH_USERS format: user1:pass1,user2:pass2
  let matched = false;
  for (const entry of process.env.AUTH_USERS.split(",")) {
    const i = entry.indexOf(":");
    if (i < 1) continue;
    const u = entry.slice(0, i).trim();
    const p = entry.slice(i + 1).trim();
    if (safeEq(u, username) && safeEq(p, password)) matched = true;
  }

  if (!matched) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Username ya password galat hai" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await createSession(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
