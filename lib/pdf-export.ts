interface PetData {
  name: string; species: string; breed?: string; dateOfBirth?: string; weight?: number; microchipId?: string
}
interface VaccinationData {
  vaccineName: string; vaccineType?: string; dateAdministered: string; expiryDate?: string
  nextDueDate: string; clinicName?: string; vetName?: string; batchNumber?: string; notes?: string; isVerified?: boolean
}

export function escapeHTML(value: unknown) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function displayDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export async function exportPetHealthRecordsPDF(pet: PetData, vaccinations: VaccinationData[]) {
  const rows = vaccinations.map((record) => `<tr>
    <td><strong>${escapeHTML(record.vaccineName)}</strong><small>${escapeHTML(record.vaccineType || '')}</small></td>
    <td>${displayDate(record.dateAdministered)}</td><td>${displayDate(record.nextDueDate)}</td>
    <td>${escapeHTML(record.clinicName || '—')}<small>${escapeHTML(record.vetName || '')}</small></td>
    <td>${record.notes ? escapeHTML(record.notes) : '—'}</td>
  </tr>`).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHTML(pet.name)} — JoyCare health records</title><style>
    *{box-sizing:border-box}body{margin:0;padding:32px;color:#17251f;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding:12px 16px;background:#f2f5f3;border-radius:12px}.toolbar button{border:0;border-radius:10px;background:#294d3c;color:white;padding:9px 14px;font-weight:600}.header{border-radius:18px;background:#294d3c;color:white;padding:26px}.header h1{margin:0;font-size:26px}.header p{margin:6px 0 0;color:#c8dbd1}.pet{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0;padding:18px;border:1px solid #dce5e0;border-radius:16px}.pet small,td small{display:block;margin-top:3px;color:#6b7c73}.pet strong{display:block;margin-top:4px}.notice{margin:18px 0;padding:12px 14px;border-radius:12px;background:#fff6e9;color:#865112}table{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;border:1px solid #dce5e0;border-radius:14px}th,td{padding:11px;text-align:left;border-bottom:1px solid #e7ece9;vertical-align:top}th{background:#f2f5f3;font-size:11px;text-transform:uppercase;letter-spacing:.04em}tr:last-child td{border-bottom:0}.footer{margin-top:20px;color:#718078;font-size:11px}@media print{body{padding:0}.toolbar{display:none}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><div class="toolbar"><span>Use your browser’s print dialog to save as PDF.</span><button onclick="window.print()">Print / Save PDF</button></div><header class="header"><h1>JoyCare</h1><p>Owner-maintained pet health record</p></header><section class="pet"><div><small>Pet</small><strong>${escapeHTML(pet.name)}</strong></div><div><small>Species / breed</small><strong>${escapeHTML(pet.species)}${pet.breed ? ` · ${escapeHTML(pet.breed)}` : ''}</strong></div><div><small>Birth date</small><strong>${displayDate(pet.dateOfBirth)}</strong></div><div><small>Microchip</small><strong>${escapeHTML(pet.microchipId || 'Not set')}</strong></div></section><p class="notice">These records were entered by the pet owner. Confirm clinical decisions with a veterinary professional.</p><h2>Vaccinations</h2>${vaccinations.length ? `<table><thead><tr><th>Vaccine</th><th>Administered</th><th>Next due</th><th>Provider</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>No vaccination records.</p>'}<footer class="footer">Generated ${displayDate(new Date().toISOString())} · JoyCare</footer><script>setTimeout(()=>window.print(),400)<\/script></body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  if (popup) popup.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  else {
    const anchor = document.createElement('a'); anchor.href = url
    anchor.download = `${pet.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'pet'}-health-records.html`
    anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
