// app/page.js
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  // Grab the cookie store for this request
  const cookieStore = cookies();
  const userToken = cookieStore.get("userToken"); // e.g. { name: 'userToken', value: '...' }

  // If a userToken cookie is present, redirect to the dashboard.
  if (userToken) {
    redirect("/dashboard");
  } else {
    // Otherwise, redirect to the login page with a reason flag.
    redirect("/login?reason=inactive");
  }
}