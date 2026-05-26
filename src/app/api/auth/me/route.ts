import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith("admin_token="))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ autenticado: false }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.json({ autenticado: true, admin: decoded });
  } catch {
    return NextResponse.json({ autenticado: false }, { status: 401 });
  }
}
