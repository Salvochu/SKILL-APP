import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getProfile, getMembership } from "@/lib/data/profile";
import { getActiveMesocycle } from "@/lib/data/mesocycles";
import ProfileForm from "@/components/profile/ProfileForm";
import ChallengeEquipmentCard from "@/components/profile/ChallengeEquipmentCard";
import AccountCard from "@/components/profile/AccountCard";

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

      <Suspense fallback={<div className="h-96 rounded-card skeleton bg-surface-2" />}>
        <ProfileSection />
      </Suspense>

      <Suspense fallback={null}>
        <ChallengeEquipmentSection />
      </Suspense>

      <Suspense fallback={null}>
        <AccountCard />
      </Suspense>
    </div>
  );
}

async function ProfileSection() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return <ProfileForm initial={profile} />;
}

async function ChallengeEquipmentSection() {
  // Fetched together rather than one after the other; the extra
  // mesocycle read for non-challenge accounts is cheaper than the wait.
  const [membership, meso] = await Promise.all([getMembership(), getActiveMesocycle()]);
  if (membership !== "challenge") return null;
  const variant = meso?.variant && meso.variant !== "Standard" ? meso.variant : "Full Gym";
  return <ChallengeEquipmentCard variant={variant} />;
}
