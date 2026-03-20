interface PetData {
  name: string
  species: string
  breed?: string
  dateOfBirth?: string
  weight?: number
  microchipId?: string
}

interface VaccinationData {
  vaccineName: string
  vaccineType?: string
  dateAdministered: string
  expiryDate?: string
  nextDueDate: string
  clinicName?: string
  vetName?: string
  batchNumber?: string
  notes?: string
  isVerified?: boolean
}

export async function exportPetHealthRecordsPDF(
  pet: PetData,
  vaccinations: VaccinationData[]
) {
  const html = generatePDFHTML(pet, vaccinations)

  const fullDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${pet.name} — Health Records</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#f3f4f6;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;">
    <span style="font-size:13px;color:#374151;">Press <strong>Ctrl+P</strong> (or ⌘+P) → <strong>Save as PDF</strong></span>
    <button onclick="window.print()" style="background:#243E36;color:white;border:none;padding:8px 18px;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600;">
      Save as PDF
    </button>
  </div>
  <div style="padding:20px;">
    ${html}
  </div>
  <script>
    // Auto-open print dialog after a short delay
    setTimeout(() => window.print(), 400)
  <\/script>
</body>
</html>`

  const blob = new Blob([fullDoc], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')

  // Revoke blob URL after window loads to free memory
  if (win) {
    win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  } else {
    // Fallback: direct download of the HTML file
    const a = document.createElement('a')
    a.href = url
    a.download = `${pet.name.replace(/\s+/g, '-').toLowerCase()}-health-records.html`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

function generatePDFHTML(pet: PetData, vaccinations: VaccinationData[]): string {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'Unknown'
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
    return `${age} year${age !== 1 ? 's' : ''} old`
  }

  const getDaysUntil = (dueDate: string) => {
    const today = new Date(); today.setHours(0,0,0,0)
    const due = new Date(dueDate); due.setHours(0,0,0,0)
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24))
  }

  const statusBadge = (nextDueDate: string) => {
    const days = getDaysUntil(nextDueDate)
    if (days < 0)   return `<span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">Overdue</span>`
    if (days <= 7)  return `<span style="background:#ffedd5;color:#ea580c;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">Due Soon</span>`
    return               `<span style="background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">Up to date</span>`
  }

  const vaccRows = vaccinations.map((v, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
        <div style="font-weight:600;color:#111827;">${v.vaccineName}</div>
        ${v.vaccineType ? `<div style="font-size:11px;color:#6b7280;text-transform:capitalize;margin-top:2px;">${v.vaccineType}</div>` : ''}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;">${formatDate(v.dateAdministered)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;">${formatDate(v.expiryDate)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${statusBadge(v.nextDueDate)}<div style="font-size:11px;color:#6b7280;margin-top:3px;">${formatDate(v.nextDueDate)}</div></td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">
        ${v.clinicName ? `<div>${v.clinicName}</div>` : ''}
        ${v.vetName ? `<div style="font-size:11px;color:#6b7280;">${v.vetName}</div>` : ''}
        ${!v.clinicName && !v.vetName ? '—' : ''}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
        ${v.isVerified
          ? `<span style="color:#16a34a;font-size:18px;">✓</span>`
          : `<span style="color:#d1d5db;font-size:18px;">—</span>`}
      </td>
    </tr>
    ${v.notes ? `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td colspan="6" style="padding:4px 12px 10px 12px;border-bottom:1px solid #e5e7eb;">
        <span style="font-size:11px;color:#6b7280;font-style:italic;">Note: ${v.notes}</span>
      </td>
    </tr>` : ''}
    ${v.batchNumber ? `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td colspan="6" style="padding:4px 12px 10px 12px;border-bottom:1px solid #e5e7eb;">
        <span style="font-size:11px;color:#6b7280;">Batch / Lot #: ${v.batchNumber}</span>
      </td>
    </tr>` : ''}
  `).join('')

  return `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;max-width:800px;margin:0 auto;">

      <!-- Header -->
      <div style="background:#243E36;color:white;padding:28px 32px;border-radius:8px 8px 0 0;margin-bottom:0;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">JoyCare</h1>
            <p style="margin:4px 0 0 0;font-size:13px;color:#7CA982;">Pet Vaccination Health Record</p>
          </div>
          <div style="text-align:right;font-size:12px;color:#a3c9a8;">
            <div>Generated</div>
            <div style="font-weight:600;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </div>

      <!-- Pet Info Bar -->
      <div style="background:#f0f7f0;border:1px solid #d1e8d1;border-top:none;padding:20px 32px;border-radius:0 0 8px 8px;margin-bottom:24px;">
        <div style="display:flex;gap:40px;flex-wrap:wrap;">
          <div>
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin-bottom:2px;">Pet Name</div>
            <div style="font-size:18px;font-weight:700;color:#111827;">${pet.name}</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin-bottom:2px;">Species / Breed</div>
            <div style="font-size:14px;font-weight:500;color:#374151;text-transform:capitalize;">${pet.species}${pet.breed ? ` • ${pet.breed}` : ''}</div>
          </div>
          ${pet.dateOfBirth ? `
          <div>
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin-bottom:2px;">Age</div>
            <div style="font-size:14px;font-weight:500;color:#374151;">${calculateAge(pet.dateOfBirth)}</div>
          </div>` : ''}
          ${pet.weight ? `
          <div>
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin-bottom:2px;">Weight</div>
            <div style="font-size:14px;font-weight:500;color:#374151;">${pet.weight} kg</div>
          </div>` : ''}
          ${pet.microchipId ? `
          <div>
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin-bottom:2px;">Microchip ID</div>
            <div style="font-size:13px;font-weight:500;color:#374151;font-family:monospace;">${pet.microchipId}</div>
          </div>` : ''}
        </div>
      </div>

      <!-- Vaccinations Section -->
      <div style="margin-bottom:32px;">
        <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.5px;">
          Vaccination Records
          <span style="font-weight:400;color:#6b7280;font-size:13px;text-transform:none;letter-spacing:0;"> — ${vaccinations.length} record${vaccinations.length !== 1 ? 's' : ''}</span>
        </h2>

        ${vaccinations.length === 0
          ? `<p style="color:#6b7280;font-style:italic;">No vaccination records available.</p>`
          : `
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:13px;">
            <thead>
              <tr style="background:#243E36;color:white;">
                <th style="padding:10px 12px;text-align:left;font-weight:600;font-size:12px;">Vaccine</th>
                <th style="padding:10px 12px;text-align:center;font-weight:600;font-size:12px;">Administered</th>
                <th style="padding:10px 12px;text-align:center;font-weight:600;font-size:12px;">Expires</th>
                <th style="padding:10px 12px;text-align:center;font-weight:600;font-size:12px;">Next Due</th>
                <th style="padding:10px 12px;text-align:left;font-weight:600;font-size:12px;">Clinic / Vet</th>
                <th style="padding:10px 12px;text-align:center;font-weight:600;font-size:12px;">Verified</th>
              </tr>
            </thead>
            <tbody>
              ${vaccRows}
            </tbody>
          </table>`
        }
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #e5e7eb;padding-top:16px;display:flex;justify-content:space-between;align-items:center;color:#9ca3af;font-size:11px;">
        <span>JoyCare — Pet eHealth Card</span>
        <span>${pet.name}'s official vaccination record</span>
      </div>

    </div>
  `
}