import { calcTotals, formatMoneyLines } from './utils'
import { buildXlsx } from './xlsx'
import { saveAndShareFile } from './saveFile'

// تصدير ملف Excel حقيقي (.xlsx). ما بنخلط العملات: كل مبلغ بعملته (مثلاً "$100 + 500,000 ل.س").
// الاسم القديم محفوظ حتى لا ينكسر أي استيراد.
export async function exportPatientsToCsv(patients, lang) {
  const ar = lang === 'ar'
  const headers = ar
    ? ['الاسم', 'الهاتف', 'العمر', 'الموعد القادم', 'عدد الجلسات', 'إجمالي التكلفة', 'إجمالي المدفوع', 'المتبقي']
    : ['Name', 'Phone', 'Age', 'Next Appointment', 'Sessions', 'Total Cost', 'Total Paid', 'Remaining']
  const rows = patients.map((p) => {
    const { costByCurrency, paidByCurrency, remainingByCurrency } = calcTotals(p)
    const ageNum = Number(p.age)
    return [
      p.name || '',
      p.phone || '',
      p.age !== '' && p.age !== null && p.age !== undefined && Number.isFinite(ageNum) ? ageNum : '',
      p.nextAppointment || '',
      p.sessions.length,
      formatMoneyLines(costByCurrency, { joiner: ' + ' }),
      formatMoneyLines(paidByCurrency, { joiner: ' + ' }),
      formatMoneyLines(remainingByCurrency, { onlyPositive: true, joiner: ' + ' })
    ]
  })
  const bytes = buildXlsx({ sheetName: ar ? 'المرضى' : 'Patients', headers, rows, rtl: ar })
  const dateStr = new Date().toISOString().slice(0, 10)
  return saveAndShareFile({
    filename: `patients_${dateStr}.xlsx`,
    bytes,
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: ar ? 'تصدير المرضى' : 'Export patients'
  })
}
