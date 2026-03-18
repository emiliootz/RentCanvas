// Tenant – Maintenance requests list

import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  MaintenanceStatusBadge,
  UrgencyBadge,
} from "@/components/ui/MaintenanceStatusBadge";

export default async function MaintenancePage() {
  const user = await requireTenant();

  const requests = await prisma.maintenanceRequest.findMany({
    where: { tenantProfileId: user.tenantProfile.id },
    orderBy: { createdAt: "desc" },
    include: { photos: { take: 1 } },
  });

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0">Maintenance Requests</h1>
        <Link href="/dashboard/maintenance/new" className="btn btn-dark btn-sm">
          + New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="alert alert-info">
          No maintenance requests yet.{" "}
          <Link href="/dashboard/maintenance/new" className="alert-link">
            Submit one now.
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {requests.map((req) => (
            <div key={req.id} className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span className="fw-semibold">{req.category}</span>
                      <UrgencyBadge urgency={req.urgency} />
                      <MaintenanceStatusBadge status={req.status} />
                    </div>
                    <p className="text-muted small mb-1 line-clamp-2">{req.description}</p>
                    <p className="text-muted" style={{ fontSize: "0.72rem" }}>
                      Submitted {formatDate(req.createdAt)}
                      {req.scheduledDate && (
                        <> · Scheduled {formatDate(req.scheduledDate)}</>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/maintenance/${req.id}`}
                    className="btn btn-sm btn-outline-secondary flex-shrink-0"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
