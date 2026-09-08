import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getClientDetail } from "@/lib/data/coach";
import ClientDetail from "@/components/coach/ClientDetail";

export const metadata = { title: "Client" };
export const instant = false;

export default function ClientPage({ params }) {
  return (
    <div className="py-2">
      <Suspense fallback={<div className="h-64 rounded-card skeleton bg-surface-2" />}>
        <Body params={params} />
      </Suspense>
    </div>
  );
}

async function Body({ params }) {
  const { id } = await params;
  const client = await getClientDetail(id);
  if (!client) notFound();
  return <ClientDetail client={client} />;
}
