// Tenant – Lease documents (uploaded by landlord)

import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function DocumentsPage() {
  const user = await requireTenant();

  // Find active lease(s) for this tenant, then get their documents
  const leaseParticipants = await prisma.leaseParticipant.findMany({
    where: { tenantProfileId: user.tenantProfile.id, isActive: true },
    include: {
      lease: {
        include: {
          documents: { orderBy: { uploadedAt: "desc" } },
          unit: true,
        },
      },
    },
  });

  const documents = leaseParticipants.flatMap((lp) =>
    lp.lease.documents.map((doc) => ({
      ...doc,
      unitNumber: lp.lease.unit.unitNumber,
    }))
  );

  return (
    <div>
      <h1 className="h3 mb-4">Lease Documents</h1>

      {documents.length === 0 ? (
        <div className="alert alert-info">
          No documents uploaded yet. Your landlord will upload lease documents here.
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3 py-2 small fw-semibold text-muted">Document</th>
                  <th className="py-2 small fw-semibold text-muted">Unit</th>
                  <th className="py-2 small fw-semibold text-muted">Uploaded</th>
                  <th className="pe-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="ps-3 py-2 small fw-semibold">{doc.name}</td>
                    <td className="py-2 small">Unit {doc.unitNumber}</td>
                    <td className="py-2 small">{formatDate(doc.uploadedAt)}</td>
                    <td className="pe-3 py-2 text-end">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-dark"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
