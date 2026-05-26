import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout realizado com sucesso.",
  });

  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}
