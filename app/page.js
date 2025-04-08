export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  // Grab the cookie store for this request
  const cookieStore = cookies();
  const userToken = cookieStore.get("userToken"); // e.g. { name: 'userToken', value: '...' }

  // If a userToken cookie is present, presumably the user is already logged in
  if (userToken) {
    // TODO: Optionally decode/verify the token in a real app
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}