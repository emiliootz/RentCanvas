import { requireAdmin } from "@/lib/auth";

export default async function Page() {
  await requireAdmin();
  return (
    <div>
      <h1 className="h3 mb-4">Leases</h1>
      <div className="alert alert-info mb-0">Coming in a future phase.</div>
    </div>
  );
}
