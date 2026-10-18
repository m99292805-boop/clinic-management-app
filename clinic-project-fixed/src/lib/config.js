// إعدادات ثابتة: التخصصات الافتراضية، العملات، بيانات الدفع والتواصل

/* ======================= Specialty config (extensible JSON) ======================= */
export const DEFAULT_SPECIALTIES = {
  dental: {
    id: 'dental',
    icon: 'fa-tooth',
    name: { ar: 'أسنان', en: 'Dentistry' },
    treatments: {
      ar: ['قلع سن', 'حشو', 'تنظيف أسنان', 'علاج عصب', 'علاج لثة', 'تركيب تاج', 'تبييض', 'تقويم', 'زراعة أسنان', 'أخرى'],
      en: ['Tooth extraction', 'Filling', 'Cleaning', 'Root canal', 'Gum treatment', 'Crown', 'Whitening', 'Braces', 'Implant', 'Other']
    },
    extraField: { ar: 'رقم السن', en: 'Tooth number' }
  },
  cardio: {
    id: 'cardio',
    icon: 'fa-heart-pulse',
    name: { ar: 'قلبية', en: 'Cardiology' },
    treatments: {
      ar: ['تخطيط قلب (ECG)', 'إيكو قلب', 'قسطرة قلبية', 'تركيب منظم ضربات', 'متابعة ضغط', 'علاج دوائي', 'أخرى'],
      en: ['ECG', 'Echocardiogram', 'Cardiac catheterization', 'Pacemaker', 'BP follow-up', 'Medication', 'Other']
    },
    extraField: { ar: 'قراءة ضغط الدم / النبض', en: 'BP / pulse reading' }
  },
  neuro: {
    id: 'neuro',
    icon: 'fa-brain',
    name: { ar: 'عصبية', en: 'Neurology' },
    treatments: {
      ar: ['تخطيط دماغ (EEG)', 'تخطيط أعصاب (EMG)', 'علاج صداع نصفي', 'علاج صرع', 'متابعة جلطة دماغية', 'علاج طبيعي عصبي', 'أخرى'],
      en: ['EEG', 'EMG', 'Migraine treatment', 'Epilepsy treatment', 'Stroke follow-up', 'Neuro physiotherapy', 'Other']
    },
    extraField: { ar: 'المنطقة/العصب المصاب', en: 'Affected area/nerve' }
  },
  derma: {
    id: 'derma',
    icon: 'fa-hand-dots',
    name: { ar: 'جلدية', en: 'Dermatology' },
    treatments: {
      ar: ['كشف عام', 'إزالة شامة/زوائد جلدية', 'علاج حب الشباب', 'علاج فطريات', 'تقشير كيميائي', 'ليزر', 'حقن بوتوكس/فيلر', 'أخرى'],
      en: ['General checkup', 'Mole/skin tag removal', 'Acne treatment', 'Fungal treatment', 'Chemical peel', 'Laser', 'Botox/filler', 'Other']
    },
    extraField: { ar: 'منطقة الجلد المصابة', en: 'Affected skin area' }
  },
  ophtho: {
    id: 'ophtho',
    icon: 'fa-eye',
    name: { ar: 'عيون', en: 'Ophthalmology' },
    treatments: {
      ar: ['فحص نظر', 'قياس ضغط العين', 'علاج التهاب', 'إزالة مياه بيضاء', 'ليزك', 'وصف نظارة/عدسات', 'أخرى'],
      en: ['Vision exam', 'Eye pressure test', 'Inflammation treatment', 'Cataract removal', 'LASIK', 'Glasses/lens prescription', 'Other']
    },
    extraField: { ar: 'العين (يمنى/يسرى/كلتا)', en: 'Eye (right/left/both)' }
  },
  pediatric: {
    id: 'pediatric',
    icon: 'fa-child-reaching',
    name: { ar: 'أطفال', en: 'Pediatrics' },
    treatments: {
      ar: ['فحص دوري', 'تطعيم', 'علاج حمى/التهابات', 'متابعة نمو', 'أخرى'],
      en: ['Routine checkup', 'Vaccination', 'Fever/infection treatment', 'Growth follow-up', 'Other']
    },
    extraField: { ar: 'الوزن والطول عند الزيارة', en: 'Weight & height at visit' }
  },
  gyneco: {
    id: 'gyneco',
    icon: 'fa-baby',
    name: { ar: 'نسائية وتوليد', en: 'Gynecology & Obstetrics' },
    treatments: {
      ar: ['فحص دوري', 'متابعة حمل', 'سونار', 'تحاليل', 'ولادة', 'أخرى'],
      en: ['Routine checkup', 'Pregnancy follow-up', 'Ultrasound', 'Lab tests', 'Delivery', 'Other']
    },
    extraField: { ar: 'عمر الحمل (إن وجد)', en: 'Gestational age (if any)' }
  },
  ortho: {
    id: 'ortho',
    icon: 'fa-bone',
    name: { ar: 'عظمية', en: 'Orthopedics' },
    treatments: {
      ar: ['جبيرة/جبس', 'حقن مفصل', 'علاج طبيعي', 'تركيب مسمار/صفيحة', 'متابعة كسر', 'أخرى'],
      en: ['Splint/cast', 'Joint injection', 'Physiotherapy', 'Nail/plate fixation', 'Fracture follow-up', 'Other']
    },
    extraField: { ar: 'الطرف/المفصل المصاب', en: 'Affected limb/joint' }
  },
  ent: {
    id: 'ent',
    icon: 'fa-ear-listen',
    name: { ar: 'أنف وأذن وحنجرة', en: 'ENT' },
    treatments: {
      ar: ['تنظيف أذن', 'علاج التهاب جيوب', 'إزالة لوزتين', 'فحص سمع', 'أخرى'],
      en: ['Ear cleaning', 'Sinus infection treatment', 'Tonsillectomy', 'Hearing test', 'Other']
    },
    extraField: { ar: 'الجهة المصابة', en: 'Affected side' }
  },
  internal: {
    id: 'internal',
    icon: 'fa-stethoscope',
    name: { ar: 'باطنية', en: 'Internal Medicine' },
    treatments: {
      ar: ['فحص عام', 'متابعة سكري/ضغط', 'تحاليل', 'متابعة مزمنة', 'أخرى'],
      en: ['General checkup', 'Diabetes/BP follow-up', 'Lab tests', 'Chronic follow-up', 'Other']
    },
    extraField: { ar: 'القيمة/التحليل المتابع', en: 'Value/test followed' }
  },
  surgery: {
    id: 'surgery',
    icon: 'fa-user-doctor',
    name: { ar: 'جراحة عامة', en: 'General Surgery' },
    treatments: {
      ar: ['استشارة قبل عملية', 'عملية', 'متابعة بعد عملية', 'تغيير ضماد', 'أخرى'],
      en: ['Pre-op consultation', 'Operation', 'Post-op follow-up', 'Dressing change', 'Other']
    },
    extraField: { ar: 'نوع العملية', en: 'Operation type' }
  },
  psych: {
    id: 'psych',
    icon: 'fa-comment-medical',
    name: { ar: 'نفسية', en: 'Psychiatry' },
    treatments: {
      ar: ['جلسة تقييم أولي', 'جلسة علاج نفسي', 'متابعة دوائية', 'أخرى'],
      en: ['Initial evaluation', 'Therapy session', 'Medication follow-up', 'Other']
    },
    extraField: { ar: 'مدة الجلسة (دقيقة)', en: 'Session duration (min)' }
  },
  nutrition: {
    id: 'nutrition',
    icon: 'fa-apple-whole',
    name: { ar: 'تغذية علاجية', en: 'Clinical Nutrition' },
    treatments: {
      ar: ['استشارة أولى', 'متابعة وزن', 'خطة غذائية', 'أخرى'],
      en: ['Initial consultation', 'Weight follow-up', 'Diet plan', 'Other']
    },
    extraField: { ar: 'الوزن الحالي', en: 'Current weight' }
  },
  physio: {
    id: 'physio',
    icon: 'fa-dumbbell',
    name: { ar: 'علاج طبيعي', en: 'Physiotherapy' },
    treatments: {
      ar: ['جلسة تأهيل', 'جلسة كهرباء علاجية', 'تدليك علاجي', 'أخرى'],
      en: ['Rehab session', 'Electrotherapy session', 'Therapeutic massage', 'Other']
    },
    extraField: { ar: 'المنطقة المعالَجة', en: 'Treated area' }
  },
  urology: {
    id: 'urology',
    icon: 'fa-kidneys',
    name: { ar: 'مسالك بولية', en: 'Urology' },
    treatments: {
      ar: ['فحص عام', 'تحليل بول', 'منظار', 'متابعة حصى', 'أخرى'],
      en: ['General checkup', 'Urine test', 'Endoscopy', 'Stone follow-up', 'Other']
    },
    extraField: { ar: 'نوع الفحص', en: 'Test type' }
  },
  endocrine: {
    id: 'endocrine',
    icon: 'fa-syringe',
    name: { ar: 'غدد صماء وسكري', en: 'Endocrinology & Diabetes' },
    treatments: {
      ar: ['متابعة سكري', 'فحص هرمونات', 'ضبط جرعة أنسولين', 'أخرى'],
      en: ['Diabetes follow-up', 'Hormone test', 'Insulin dose adjustment', 'Other']
    },
    extraField: { ar: 'قراءة السكر التراكمي/العشوائي', en: 'HbA1c / random glucose reading' }
  }
}

export const ICON_CHOICES = [
  'fa-tooth', 'fa-heart-pulse', 'fa-brain', 'fa-hand-dots', 'fa-eye', 'fa-child-reaching', 'fa-baby',
  'fa-bone', 'fa-ear-listen', 'fa-stethoscope', 'fa-user-doctor', 'fa-comment-medical', 'fa-apple-whole',
  'fa-dumbbell', 'fa-kidneys', 'fa-syringe', 'fa-lungs', 'fa-tablets', 'fa-notes-medical'
]

/* ======================= Subscription & payment config ======================= */
export const ADMIN_WHATSAPP = '+963937115174'
export const ADMIN_EMAIL = 'm99292805@gmail.com'
export const TRIAL_DAYS = 7
export const PLAN_PRICES = { monthly: 10, quarterly: 25, yearly: 70 }
export const SHAMCASH_CODE = '460983a7b44cf15455226d91921809b1'
export const SHAMCASH_HOLDER = 'باسل محمود الكنج'
// صورة QR الحقيقية محفوظة كملف ثابت بمجلد public (بدل تضمينها base64 بالكود، أخف بكثير على حجم الحزمة)
export const SHAMCASH_QR = '/shamcash-qr.jpg'

// قائمة عملات موسّعة (عربية + عالمية) لاستخدامها بتسجيل الدفعات
export const CURRENCIES = [
  { code: 'USD', ar: 'دولار أمريكي', en: 'US Dollar', symbol: '$' },
  { code: 'SYP', ar: 'ليرة سورية', en: 'Syrian Pound', symbol: 'ل.س' },
  { code: 'IQD', ar: 'دينار عراقي', en: 'Iraqi Dinar', symbol: 'د.ع' },
  { code: 'SAR', ar: 'ريال سعودي', en: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'AED', ar: 'درهم إماراتي', en: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'EGP', ar: 'جنيه مصري', en: 'Egyptian Pound', symbol: 'ج.م' },
  { code: 'JOD', ar: 'دينار أردني', en: 'Jordanian Dinar', symbol: 'د.أ' },
  { code: 'LBP', ar: 'ليرة لبنانية', en: 'Lebanese Pound', symbol: 'ل.ل' },
  { code: 'KWD', ar: 'دينار كويتي', en: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'QAR', ar: 'ريال قطري', en: 'Qatari Riyal', symbol: 'ر.ق' },
  { code: 'BHD', ar: 'دينار بحريني', en: 'Bahraini Dinar', symbol: 'د.ب' },
  { code: 'OMR', ar: 'ريال عماني', en: 'Omani Rial', symbol: 'ر.ع' },
  { code: 'YER', ar: 'ريال يمني', en: 'Yemeni Rial', symbol: 'ر.ي' },
  { code: 'LYD', ar: 'دينار ليبي', en: 'Libyan Dinar', symbol: 'د.ل' },
  { code: 'TND', ar: 'دينار تونسي', en: 'Tunisian Dinar', symbol: 'د.ت' },
  { code: 'MAD', ar: 'درهم مغربي', en: 'Moroccan Dirham', symbol: 'د.م' },
  { code: 'DZD', ar: 'دينار جزائري', en: 'Algerian Dinar', symbol: 'د.ج' },
  { code: 'SDG', ar: 'جنيه سوداني', en: 'Sudanese Pound', symbol: 'ج.س' },
  { code: 'TRY', ar: 'ليرة تركية', en: 'Turkish Lira', symbol: '₺' },
  { code: 'EUR', ar: 'يورو', en: 'Euro', symbol: '€' },
  { code: 'GBP', ar: 'جنيه إسترليني', en: 'British Pound', symbol: '£' },
  { code: 'CAD', ar: 'دولار كندي', en: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', ar: 'دولار أسترالي', en: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', ar: 'فرنك سويسري', en: 'Swiss Franc', symbol: 'Fr' },
  { code: 'JPY', ar: 'ين ياباني', en: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', ar: 'يوان صيني', en: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', ar: 'روبية هندية', en: 'Indian Rupee', symbol: '₹' },
  { code: 'RUB', ar: 'روبل روسي', en: 'Russian Ruble', symbol: '₽' }
]
