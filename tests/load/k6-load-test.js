import http from 'k6/http';
import { check, sleep, group } from 'k6';

// 1. الخيارات والتكوين (Options & Configuration)
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // زيادة المستخدمين تدريجياً إلى 20 مستخدم في 30 ثانية
    { duration: '1m', target: 20 },  // الحفاظ على 20 مستخدم لمدة دقيقة كاملة
    { duration: '30s', target: 0 },  // إنهاء المستخدمين وتصفيرهم تدريجياً في 30 ثانية
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // يجب أن تكون نسبة فشل الطلبات أقل من 1%
    http_req_duration: ['p(95)<1500'], // 95% من الطلبات يجب أن تستجيب في أقل من 1.5 ثانية (1500ms)
  },
};

// 2. المتغيرات والبيانات التجريبية (Data & Variables)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// قائمة بالمعرفات (Slugs) الخاصة بالمتون المحلية المتاحة في المشروع للتصفح العشوائي
const BOOK_SLUGS = [
  'al-ajrumiyyah',
  'al-durrah-al-mudiyyah',
  'al-jazariyyah',
  'al-shatibiyyah',
  'al-zubad',
  'alfiyyat-ibn-malik',
  'bayquniyyah',
  'mulhat-al-irab',
  'bismi-allah-al-rahman-al-rahim',
  'tuhfat-al-atfal'
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 3. السيناريو الرئيسي للاختبار (Default Scenario)
export default function () {
  const headers = {
    'User-Agent': 'k6-load-test',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  };

  const jsonHeaders = Object.assign({}, headers, { 'Accept': 'application/json' });

  // أ. الصفحات العامة والتسويقية (Marketing & Static Pages)
  group('01. Public & Marketing Pages', function () {
    // 1. الصفحة الرئيسية
    const homeRes = http.get(`${BASE_URL}/`, { headers });
    check(homeRes, {
      'home page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);

    // 2. صفحة من نحن
    const aboutRes = http.get(`${BASE_URL}/about`, { headers });
    check(aboutRes, {
      'about page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);

    // 3. صفحة اتصل بنا
    const contactRes = http.get(`${BASE_URL}/contact`, { headers });
    check(contactRes, {
      'contact page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);

    // 4. سياسة الخصوصية
    const privacyRes = http.get(`${BASE_URL}/privacy`, { headers });
    check(privacyRes, {
      'privacy page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 1 + 0.5);

    // 5. شروط الخدمة
    const termsRes = http.get(`${BASE_URL}/terms`, { headers });
    check(termsRes, {
      'terms page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 1 + 0.5);
  });

  // ب. صفحات تسجيل الدخول والتسجيل (Authentication Pages)
  group('02. Auth Pages', function () {
    // 1. صفحة تسجيل الدخول (login)
    const loginRes = http.get(`${BASE_URL}/login`, { headers });
    check(loginRes, {
      'login page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);

    // 2. البديل (sign-in)
    const signInRes = http.get(`${BASE_URL}/sign-in`, { headers });
    check(signInRes, {
      'sign-in page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);

    // 3. صفحة إنشاء حساب (register)
    const registerRes = http.get(`${BASE_URL}/register`, { headers });
    check(registerRes, {
      'register page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);

    // 4. البديل (sign-up)
    const signUpRes = http.get(`${BASE_URL}/sign-up`, { headers });
    check(signUpRes, {
      'sign-up page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);
  });

  // ج. تصفح المتون الرئيسية (Books Catalog)
  group('03. Books Catalog & APIs', function () {
    // 1. صفحة قائمة المتون
    const booksRes = http.get(`${BASE_URL}/books`, { headers });
    check(booksRes, {
      'books catalog: status is 200': (r) => r.status === 200,
      'books catalog: contains branding': (r) => r.body && (r.body.includes('متون') || r.body.includes('المتون')),
    });
    sleep(Math.random() * 2 + 1);

    // 2. الـ API الخاص بجلب كافة المتون
    const apiAllRes = http.get(`${BASE_URL}/api/books/all`, { headers: jsonHeaders });
    check(apiAllRes, {
      'api all books: status is 200': (r) => r.status === 200,
      'api all books: response is JSON': (r) => r.headers && r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    });
    sleep(Math.random() * 2 + 1);
  });

  // د. تصفح المتن الفردي وقراءته (Single Book Context)
  const slug = getRandomElement(BOOK_SLUGS);

  group('04. Single Book Pages', function () {
    // 1. صفحة تفاصيل المتن
    const detailRes = http.get(`${BASE_URL}/books/${slug}`, { headers });
    check(detailRes, {
      'book details: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 3 + 2);

    // 2. الـ API لتفاصيل المتن
    const apiDetailRes = http.get(`${BASE_URL}/api/books/${encodeURIComponent(slug)}`, { headers: jsonHeaders });
    check(apiDetailRes, {
      'api book details: status is 200': (r) => r.status === 200,
      'api book details: contains fields': (r) => r.body && r.body.includes('book') && r.body.includes('verses'),
    });
    sleep(Math.random() * 2 + 1);

    // 3. صفحة قراءة المتن
    const readRes = http.get(`${BASE_URL}/books/${slug}/read`, { headers });
    check(readRes, {
      'book read page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 4 + 2);
  });

  // هـ. صفحات الدراسة والتفاعل للمستخدم (User Interactive Study Pages)
  group('05. Study Pages (Memorize, Recite, Certificate)', function () {
    // 1. صفحة الحفظ والتكرار
    const memorizeRes = http.get(`${BASE_URL}/books/${slug}/memorize`, { headers });
    check(memorizeRes, {
      'memorize page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 3 + 2);

    // 2. صفحة التسميع والمراجعة الصوتية
    const reciteRes = http.get(`${BASE_URL}/books/${slug}/recite`, { headers });
    check(reciteRes, {
      'recite page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 3 + 2);

    // 3. صفحة الشهادات للمتن
    const certRes = http.get(`${BASE_URL}/books/${slug}/certificate`, { headers });
    check(certRes, {
      'certificate page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);
  });

  // و. لوحة تحكم المستخدم الشخصية (User Account Dashboard)
  group('06. User Dashboard Pages', function () {
    // 1. صفحة ملف المستخدم
    const profileRes = http.get(`${BASE_URL}/profile`, { headers });
    check(profileRes, {
      'profile page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);

    // 2. صفحة التقدم الدراسي للحفظ
    const progressRes = http.get(`${BASE_URL}/progress`, { headers });
    check(progressRes, {
      'progress page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);

    // 3. صفحة المفضلة
    const favoritesRes = http.get(`${BASE_URL}/favorites`, { headers });
    check(favoritesRes, {
      'favorites page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);

    // 4. صفحة الإشعارات
    const notifRes = http.get(`${BASE_URL}/notifications`, { headers });
    check(notifRes, {
      'notifications page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);

    // 5. صفحة الإعدادات
    const settingsRes = http.get(`${BASE_URL}/settings`, { headers });
    check(settingsRes, {
      'settings page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);
  });

  // ز. صفحة التصفح بدون إنترنت (PWA Offline Fallback)
  group('07. PWA Offline Page', function () {
    const offlineRes = http.get(`${BASE_URL}/offline`, { headers });
    check(offlineRes, {
      'offline page: status is 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 2 + 1);
  });
}
