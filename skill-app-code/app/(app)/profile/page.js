import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data/profile";
import ProfileForm from "@/components/profile/ProfileForm";
import DangerZone from "@/components/profile/DangerZone";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Profile</h1>
        <p className="text-sm text-muted">
          Tell us a bit about your goals. This also helps Coach Salvador tailor any coaching he
          offers you.
        </p>
      </header>

      <Suspense fallback={<div className="h-96 rounded-card bg-surface" />}>
        <ProfileSection />
      </Suspense>

      <DangerZone />
    </div>
  );
}

async function ProfileSection() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return <ProfileForm initial={profile} />;
}
