// Admin – Units overview: shows all units, active tenants, and lease status.

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, fullName } from "@/lib/utils";
import Link from "next/link";

export default async function AdminUnitsPage() {
  await requireAdmin();

  const units = await prisma.unit.findMany({
    include: {
      property: true,
      leases: {
        where: { isActive: true },
        include: {
          participants: {
            where: { isActive: true },
            include: { tenantProfile: true },
          },
        },
      },
    },
    orderBy: { unitNumber: "asc" },
  });

  return (
    <div>
      <h1 className="h3 mb-4">Units</h1>
      <div className="row g-4">
        {units.map((unit) => {
          const activeLease = unit.leases[0];
          const tenants = activeLease?.participants ?? [];
          const isOccupied = tenants.length > 0;

          return (
            <div key={unit.id} className="col-md-6 col-xl-4">
              <div className={`card shadow-sm h-100 border-start border-4 ${isOccupied ? "border-success" : "border-secondary"}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="mb-0">Unit {unit.unitNumber}</h5>
                    <span className={`badge ${isOccupied ? "bg-success" : "bg-secondary"}`}>
                      {isOccupied ? "Occupied" : "Vacant"}
                    </span>
                  </div>
                  <p className="text-muted small mb-2">
                    {unit.property.name} · {unit.property.address}
                  </p>
                  {(unit.bedrooms || unit.sqft) && (
                    <p className="text-muted small mb-2">
                      {unit.bedrooms && `${unit.bedrooms} bed`}
                      {unit.bathrooms && ` · ${unit.bathrooms} bath`}
                      {unit.sqft && ` · ${unit.sqft.toLocaleString()} sqft`}
                    </p>
                  )}

                  {activeLease ? (
                    <div className="mt-3">
                      <div className="small text-muted mb-1 fw-semibold">
                        Total Rent: {formatCurrency(activeLease.monthlyRent)}/mo
                      </div>
                      <div className="small text-muted">
                        Lease from {formatDate(activeLease.startDate)}
                      </div>
                      {tenants.length > 0 && (
                        <ul className="list-unstyled mt-2 mb-0">
                          {tenants.map((lp) => (
                            <li key={lp.id} className="d-flex align-items-center gap-2 mb-1">
                              <span className="small fw-semibold">
                                {fullName(lp.tenantProfile.firstName, lp.tenantProfile.lastName)}
                              </span>
                              <span className="text-muted small">
                                ({formatCurrency(lp.rentShare)}/mo)
                              </span>
                              <Link
                                href={`/admin/tenants/${lp.tenantProfile.id}`}
                                className="ms-auto text-decoration-none small"
                              >
                                View →
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted small mt-2 mb-0">No active lease.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
