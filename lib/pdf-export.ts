import html2pdf from 'html2pdf.js'

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
  vaccinationDate: string
  nextDueDate: string
  clinicName?: string
  notes?: string
}

export async function exportPetHealthRecordsPDF(
  pet: PetData,
  vaccinations: VaccinationData[]
) {
  const element = document.createElement('div')
  element.innerHTML = generatePDFHTML(pet, vaccinations)

  const opt = {
    margin: 10,
    filename: `${pet.name}-health-records.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
  }

  html2pdf().set(opt).from(element).save()
}

function generatePDFHTML(pet: PetData, vaccinations: VaccinationData[]): string {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'Unknown'
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return `${age} years old`
  }

  const vaccinationHTML = vaccinations
    .map(
      (vacc) => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 8px; text-align: left;">${vacc.vaccineName}</td>
      <td style="padding: 8px; text-align: center;">${formatDate(vacc.vaccinationDate)}</td>
      <td style="padding: 8px; text-align: center;">${formatDate(vacc.nextDueDate)}</td>
      <td style="padding: 8px; text-align: left;">${vacc.clinicName || 'N/A'}</td>
    </tr>
  `
    )
    .join('')

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937; margin: 0;">Joy PetCenter - Health Records</h1>
        <p style="color: #6b7280; margin-top: 5px;">Pet Vaccination & Medical Records</p>
      </div>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #1f2937; margin-top: 0;">Pet Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; font-weight: bold; width: 30%;">Name:</td>
            <td style="padding: 10px;">${pet.name}</td>
          </tr>
          <tr style="background: white;">
            <td style="padding: 10px; font-weight: bold;">Species:</td>
            <td style="padding: 10px;">${pet.species}${pet.breed ? ` (${pet.breed})` : ''}</td>
          </tr>
          ${pet.dateOfBirth ? `
          <tr>
            <td style="padding: 10px; font-weight: bold;">Age:</td>
            <td style="padding: 10px;">${calculateAge(pet.dateOfBirth)}</td>
          </tr>
          ` : ''}
          ${pet.weight ? `
          <tr style="background: white;">
            <td style="padding: 10px; font-weight: bold;">Weight:</td>
            <td style="padding: 10px;">${pet.weight} kg</td>
          </tr>
          ` : ''}
          ${pet.microchipId ? `
          <tr>
            <td style="padding: 10px; font-weight: bold;">Microchip ID:</td>
            <td style="padding: 10px;">${pet.microchipId}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937;">Vaccination Records</h2>
        ${vaccinations.length === 0 ? `
          <p style="color: #6b7280;">No vaccination records available.</p>
        ` : `
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db;">Vaccine</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #d1d5db;">Date</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #d1d5db;">Next Due</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db;">Clinic</th>
              </tr>
            </thead>
            <tbody>
              ${vaccinationHTML}
            </tbody>
          </table>
        `}
      </div>

      <div style="text-align: center; margin-top: 40px; color: #6b7280; border-top: 1px solid #e0e0e0; padding-top: 20px;">
        <p style="margin: 0;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p style="margin: 5px 0 0 0; font-size: 12px;">Joy PetCenter - Pet Vaccination Tracker</p>
      </div>
    </div>
  `
}
