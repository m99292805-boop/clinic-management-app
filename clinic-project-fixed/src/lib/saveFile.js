// حفظ/مشاركة ملف: داخل تطبيق الأندرويد (Capacitor) عبر Filesystem + Share (لأن WebView يمنع التنزيل المباشر)،
// وعلى المتصفح العادي عبر رابط تنزيل.
function bytesToBase64(bytes) {
  let bin = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
  }
  return btoa(bin)
}

export async function saveAndShareFile({ filename, bytes, mime, dialogTitle }) {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')])
      const written = await Filesystem.writeFile({ path: filename, data: bytesToBase64(bytes), directory: Directory.Cache })
      await Share.share({ title: dialogTitle || filename, dialogTitle: dialogTitle || filename, url: written.uri })
      return true
    }
  } catch (err) {
    // المستخدم أغلق نافذة المشاركة = ليس خطأ
    if (err && /cancel/i.test(String(err.message || err))) return true
    // eslint-disable-next-line no-console
    console.error('native save failed, falling back to browser download', err)
  }
  try {
    const blob = new Blob([bytes], { type: mime })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 10000)
    return true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('download failed', err)
    return false
  }
}
