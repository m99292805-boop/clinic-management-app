const DEFAULT_MAX_BYTES = 5 * 1024 * 1024 // 5 ميغابايت
const DEFAULT_MAX_DIM = 1000

/**
 * يتحقق من نوع/حجم ملف صورة، يضغطه/يصغّره عبر canvas، ويرجع data URL جاهز للتخزين.
 * يرمي Error برسالة 'invalid-type' أو 'too-large' لو الملف مرفوض، عشان المستدعي يقرر رسالة الخطأ المناسبة بلغته.
 */
export function compressImageFile(file, { maxDim = DEFAULT_MAX_DIM, maxBytes = DEFAULT_MAX_BYTES, quality = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null)
      return
    }
    // تحقق فعلي من نوع الملف (accept="image/*" بالـ input وحدها مش كافية، ممكن تتجاوز)
    if (!file.type || !file.type.startsWith('image/')) {
      reject(new Error('invalid-type'))
      return
    }
    if (file.size > maxBytes) {
      reject(new Error('too-large'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h)
          w = Math.round(w * scale)
          h = Math.round(h * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff' // خلفية بيضاء: وإلا الصور الشفافة (PNG) تطلع بخلفية سودا بعد التحويل لـ JPEG
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('invalid-type'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('invalid-type'))
    reader.readAsDataURL(file)
  })
}
