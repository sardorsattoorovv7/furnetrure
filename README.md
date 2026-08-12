# Mebel Zavodi — React Frontend (Phase 2 + 3 + 4)

Django backend bilan ishlaydigan to'liq frontend: auth, katalog, admin CRUD,
3D viewer, va **WebAR joylashtirish**.

## Ishga tushirish

```bash
npm install
cp .env.example .env      # backend manzilini moslang
npm run dev
```

Brauzerda: http://localhost:5173 (backend parallel, port 8000'da ishlab turishi kerak)

**Muhim: AR faqat HTTPS orqali ishlaydi** (WebXR va kamera brauzer talabi).
Lokal test uchun `localhost` istisno hisoblanadi, lekin real qurilmada
sinash uchun HTTPS (masalan ngrok yoki production domen) kerak bo'ladi.

## Struktura

```
src/
  api/            axios client, auth/furniture/projects so'rovlari
  hooks/          useWebXRSupport - AR qo'llab-quvvatlashni aniqlash
  context/        AuthContext
  components/
    FurnitureModel.jsx       GLB yuklash + real o'lchamga scale qilish
    FurnitureViewer3D.jsx    Studio 3D viewer (rotate/zoom/pan/fullscreen)
    PlacementIndicator.jsx   WebXR hit-test - pol aniqlash nishoni
    PlacedFurniture.jsx      AR sahnasidagi joylashtirilgan mebel + status rangi
    IOSQuickLookFallback.jsx iOS uchun <model-viewer> AR Quick Look
  pages/
    LoginPage, RegisterPage
    CatalogPage, FurnitureDetailPage   (3D ko'rish + AR'ga o'tish tugmasi)
    ARPage                             AR asosiy sahifa
    DashboardPage, Admin*Page          (xodim tomoni)
    ProjectsPage, ProjectDetailPage
```

## Nima tayyor

### Phase 2 — Auth + CRUD + Loyihalar
JWT auth, role-based routing, mijoz katalogi, admin CRUD, loyiha/xona/
placement boshqaruvi (qo'lda X/Z kiritish orqali - AR yo'q edi).

### Phase 3 — 3D Viewer
`@react-three/fiber` + Three.js orqali GLB modelni ko'rish. Model **real
balandligi** (Furniture.height_mm) asosida avtomatik scale qilinadi - bu
keyinchalik AR joylashtirish bilan bir xil mantiq, shuning uchun studio
viewer'da ko'rilgan o'lcham AR'dagi bilan mos keladi. Bundle hajmini
kamaytirish uchun Three.js **lazy-load** qilinadi - faqat "3D ko'rish"
bosilganda yuklanadi.

### Phase 4 — WebAR (asosiy funksiya)
`@react-three/xr` (WebXR) orqali:

- **Real hit-test**: `useXRHitTest` orqali kamera qaragan joydagi haqiqiy
  sirtni (pol) aniqlaydi - qattiq offset yoki taxminiy joylashtirish emas.
- **Tap-to-place**: aniqlangan nuqtaga bosilganda mebel **haqiqiy
  o'lchamida** joylashadi (scale hech qachon 1.0'dan boshqa bo'lmaydi).
- **Real-time compatibility**: har bir joylashtirishda backend'ning
  `/compatibility/check/` chaqiriladi - boshqa joylashtirilgan mebellar
  obstacle sifatida yuboriladi. Natija (🟢/🟡/🔴 + sabab) HUD'da darhol
  ko'rsatiladi.
- **Move/Rotate/Delete**: tanlangan mebelni aylantirish (15° qadam bilan)
  va o'chirish mumkin.
- **Loyiha sifatida saqlash**: AR sessiyasida joylashtirilgan barcha
  mebellar bitta tugma bilan Project + Room + Placement sifatida
  backend'ga saqlanadi.
- **Browser capability detection**: `navigator.xr.isSessionSupported()`
  orqali haqiqiy tekshiruv - hech qachon "AR ishlaydi" deb soxta taxmin
  qilinmaydi.
- **iOS fallback**: Safari WebXR'ni qo'llab-quvvatlamagani uchun iOS
  qurilmalarida avtomatik `<model-viewer>` + AR Quick Look'ga o'tadi.

## Muhim va halol texnik eslatmalar

1. **iOS AR Quick Look uchun USDZ kerak.** `<model-viewer>` GLB bilan
   Android (Scene Viewer) va WebXR uchun ishlaydi, lekin haqiqiy iOS Quick
   Look odatda **USDZ** formatini talab qiladi. Backend hozircha faqat GLB
   saqlaydi - bu Phase 5'da GLB→USDZ konvertatsiya bosqichi sifatida
   qo'shilishi kerak. Hozirgi holatda iPhone'da "AR'da ko'rish" tugmasi
   ba'zi qurilma/model kombinatsiyalarida ishlamasligi mumkin.

2. **Xona to'liq skanerlanmaydi.** Compatibility tekshiruvi placement-based
   collision detection'ga asoslangan - foydalanuvchi mebel qo'ygan sayin
   backend uni boshqa joylashtirilgan mebellar bilan solishtiradi. Bu
   avtomatik "butun xona konturini o'lchab olish" emas (buning uchun LiDAR
   kerak bo'lardi) - lekin amaliy maqsad uchun (bitta joyga mebel
   sig'yaptimi) yetarli va ishonchli.

3. **Environment HDR emas, studio yoritish ishlatiladi.** 3D
   viewer/AR'da tashqi CDN'dan HDR muhit xaritasi (`Environment preset`)
   o'rniga qo'lda sozlangan 3 nuqtali yoritish ishlatiladi - bu tashqi
   tarmoq bog'liqligini yo'qotadi (production'da ishonchliroq), lekin
   metall/oynasimon materiallar biroz kamroq realistik ko'rinishi mumkin.

4. **`@react-three/xr` ichidagi "emulate" chunk'lari** (office_small,
   living_room va h.k., bir necha MB) build çıktısida ko'rinadi - bular
   kutubxonaning ichki **dev-emulyator** rasmlari (haqiqiy AR qurilmasiz
   test qilish uchun). Alohida lazy chunk sifatida ajratilgan va oddiy
   foydalanuvchi ularni hech qachon yuklamaydi.

## Keyingi bosqichlar

- **Phase 5**: GLB→USDZ konvertatsiya (iOS uchun to'liq AR), PDF report,
  QR code, screenshot saqlash, quotation UI
