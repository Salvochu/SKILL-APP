import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getClients } from "@/lib/data/coach";
import { getUnitPreference } from "@/lib/data/profile";
import ClientList from "@/components/coach/ClientList";
import InviteButton from "@/components/coach/InviteButton";

export const metadata = { title: "Clients" };
export const instant = false;

export default function ClientsPage() {
  return (
    <div className="py-2">
      <Suspense fallback={<div className="h-72 rounded-2xl skeleton bg-surface-2" />}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const [data, unit] = await Promise.all([getClients(), getUnitPreference()]);
  if (!data) notFound();
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Clients</h1>
          <InviteButton />
        </div>
        <p className="text-[15px] text-muted">Who is training, who is progressing, who to talk to.</p>
      </header>
      <ClientList data={data} unit={unit} />
    </div>
  );
}
