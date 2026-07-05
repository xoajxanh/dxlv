"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const password = formData.get("password");

  if (password === "0chomayBIK!@#") {
    const cookieStore = await cookies();
    cookieStore.set("dxlv_secure_doc_token", "authorized", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });
    return { success: true };
  }

  return { success: false, error: "Sai mật khẩu!" };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("dxlv_secure_doc_token");
  redirect("/document");
}
