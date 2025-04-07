// app/page.js
import { redirect } from "next/navigation";

export default function Home() {
  // Immediately redirect from "/" to "/login"
  redirect("/login");
}