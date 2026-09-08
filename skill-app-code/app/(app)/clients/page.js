import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getClients } from "@/lib/data/coach";
import ClientList from "@/components/coach/ClientList";

export const metadata = { title: "Clients" };
export const instant = false;

export default function ClientsPage() {
  return (
    <div className="py-2">
      <Suspense fallback={<div className="h-64 rounded-card skeleton bg-surface-2" />}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const data = await getClients();
  if (!data) notFound();
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Clients</h1>
        <p className="text-sm text-muted">Who is training, who is progressing, who to talk to.</p>
      </header>
      <ClientList data={data} />
    </div>
  );
}
