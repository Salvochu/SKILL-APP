import { redirect } from "next/navigation";

// Anyone reaching "/" is already authenticated — proxy.js sends every
// signed-out request to /login before it gets here — so this just routes
// on to the real home screen.
export default function Home() {
  redirect("/dashboard");
}
