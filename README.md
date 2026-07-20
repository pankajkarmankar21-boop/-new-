# किसान जुताई — Setup Guide

## आतापर्यंत तयार आहे (Phase 1)

- ✅ Complete PostgreSQL schema (`supabase/schema.sql`) — Farmers, Drivers, Farms(7/12), Services, Subscriptions, Bookings, Booking Items, Payments, Chat, Notifications, Leaderboard, Audit Logs
- ✅ Row Level Security policies (`supabase/rls_policies.sql`) — प्रत्येक role फक्त स्वतःचा data बघू शकतो
- ✅ Storage buckets + policies (Aadhar, Farm docs, Driver docs, Completion photos, Chat images)
- ✅ Next.js 14 + TypeScript + Tailwind project structure
- ✅ Supabase client (browser + server + middleware) — session/role based route protection
- ✅ PWA config (manifest, next-pwa)
- ✅ Premium Glass-UI design system (gradients, animations, dark mode ready)
- ✅ Home screen (Farmer / Driver / Admin selection)
- ✅ Farmer OTP Login (Supabase Phone Auth — real, working)
- ✅ Farmer Registration (personal details + Aadhar + **अमर्याद** 7/12 upload, Camera/Gallery/PDF)
- ✅ Image compression + Supabase Storage upload helper

## Setup Steps (तुम्ही करायचे)

### 1. Supabase Project
1. https://supabase.com वर नवीन project तयार करा
2. **SQL Editor** मध्ये जाऊन क्रमाने run करा:
   - `supabase/schema.sql`
   - `supabase/rls_policies.sql`
3. **Authentication > Providers > Phone** enable करा
4. **Authentication > Providers > Phone > SMS Provider** मध्ये Twilio/MSG91 जोडा (Supabase स्वतः OTP पाठवत नाही — मागे एक SMS provider लागतो, हे free नाही पण स्वस्त आहे)
5. Settings > API मधून `Project URL`, `anon key`, `service_role key` घ्या

### 2. Environment Variables
`.env.example` ला `.env.local` म्हणून copy करा आणि actual keys भरा:
```bash
cp .env.example .env.local
```

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Razorpay (Payment साठी, Phase 4 मध्ये लागेल)
https://dashboard.razorpay.com वर account तयार करून Key ID + Secret घ्या.

### 5. Deploy
```bash
git init && git add . && git commit -m "Phase 1: Foundation"
git remote add origin <तुमचा GitHub repo URL>
git push -u origin main
```
मग Vercel वर import करून environment variables टाका.

## आतापर्यंत तयार आहे (Phase 2 — Subscription + Booking + Payment)

- ✅ Razorpay integration — order creation (server-verified amount) + signature verification
- ✅ Subscription page — सर्व/ठराविक शेत निवड, automatic ₹550/एकर calculation
- ✅ Multi-farm multi-service Booking flow — प्रत्येक ओळीत वेगळे शेत+सेवा, automatic amount + ५०% subscriber discount
- ✅ `notify_nearby_drivers()` — payment यशस्वी झाल्यावर फक्त संबंधित गावातील driver ला notify होते
- ✅ Farmer Home screen — current booking status, driver contact, services list

## आतापर्यंत तयार आहे (Phase 3 — Driver Flow)

- ✅ Driver OTP Login + Registration (RC Book, License, Aadhar, Tractor Photo — सर्व mandatory)
- ✅ New Requests — फक्त nearby/own village च्या बुकिंग दिसतात, realtime update
- ✅ Accept / Reject (mandatory reason) — race-condition सुरक्षित (दुसरा driver आधी स्वीकारल्यास चूक दाखवते)
- ✅ Status flow — स्वीकारले → निघालो → पोहोचलो → काम सुरू → काम पूर्ण
- ✅ Job completion — Farmer OTP + किमान १ फोटो mandatory, OTP जुळल्याशिवाय पूर्ण होत नाही
- ✅ Driver Menu — New Requests, My Jobs, Earnings, Profile (edit करता येते)
- ✅ Leaderboard — Village-wise, Monthly/Yearly, Top-3 ला automatic incentive (₹1000/₹500/₹250)
- ✅ `refresh_driver_leaderboard()` SQL function — booking पूर्ण झाल्यावर automatic ट्रिगर होते

## नवीन SQL फाईल्स (क्रमाने Supabase मध्ये run करा)

1. `supabase/schema.sql`
2. `supabase/rls_policies.sql`
3. `supabase/phase2_functions.sql`
4. `supabase/phase3_functions.sql`

## आतापर्यंत तयार आहे (Phase 4 — Chat + Notifications + History)

- ✅ Realtime Chat (WhatsApp-सारखी) — Farmer↔Driver, text + image, Supabase Realtime वापरून instant delivery
- ✅ Farmer Booking Detail — status stepper, **Completion OTP ठळकपणे दाखवला जातो** (हाच OTP शेतकरी driver ला सांगतो)
- ✅ Farmer Booking History — Search, Filter (सर्व/सुरू/पूर्ण), Pagination
- ✅ Farmer Invoices — Payment history + PDF Invoice download (jsPDF)
- ✅ Notifications page (Farmer + Driver दोघांसाठी shared component) — Realtime auto-update
- ✅ Push Notification Infrastructure — Service worker (`sw-push-source.js`), subscribe hook, VAPID-based send API

### Push Notifications Setup (Vercel Deploy आधी)
```bash
npx web-push generate-vapid-keys
```
मिळालेल्या keys `.env.local` मध्ये `NEXT_PUBLIC_VAPID_PUBLIC_KEY` आणि `VAPID_PRIVATE_KEY` म्हणून टाका.

**Automatic push साठी** (उदा. नवीन बुकिंग आल्यावर driver ला लगेच push जावा): Supabase Dashboard > Database > Webhooks मध्ये जाऊन `notifications` table वर INSERT trigger असलेला webhook तयार करा, जो `/api/push/send` ला कॉल करेल. सध्या in-app notifications realtime आहेत; हे webhook फक्त फोन lock असताना/app बंद असताना notification साठी लागते.

## नवीन SQL फाईल (क्रमाने Supabase मध्ये run करा)

1. `supabase/schema.sql`
2. `supabase/rls_policies.sql`
3. `supabase/phase2_functions.sql`
4. `supabase/phase3_functions.sql`
5. `supabase/phase4_push_and_realtime.sql`

## आतापर्यंत तयार आहे (Phase 5 — Admin Dashboard, अंतिम टप्पा)

- ✅ Admin OTP Login — फक्त pre-seeded admin accounts (self-registration नाही, सुरक्षेसाठी)
- ✅ Overview Dashboard — Total Farmers/Drivers/Bookings, एकूण/Subscription/Service महसूल, Top गावे, Pending approvals alert
- ✅ Farmer Search + Approve/Reject (mandatory reason) — Aadhar + ७/१२ documents inline पाहता येतात
- ✅ Driver Search + Approve/Reject (mandatory reason) — सर्व कागदपत्रे (RC Book, License, Aadhar, Tractor Photo) पाहता येतात
- ✅ Complete Booking History — Search, Pagination, Admin साठी सर्व बुकिंग एका ठिकाणी
- ✅ Analytics — Village-wise (Farmers/Drivers/Acre/Revenue) व Service-wise Charts (Bar + Pie, recharts), **PDF आणि Excel Export**
- ✅ Broadcast Notification — सर्वांना / गाव-निहाय / सर्व शेतकरी / सर्व ड्रायव्हर निवडून पाठवता येते

### पहिला Admin Account कसा तयार करायचा
Admin ला self-registration नाही (सुरक्षेसाठी मुद्दाम असे ठेवले आहे). पहिल्यांदा:
1. त्या मोबाईल नंबरने App च्या कोणत्याही (Farmer/Driver) OTP login मधून एकदा लॉगिन करा — यामुळे `auth.users` आणि `profiles` row तयार होईल.
2. Supabase SQL Editor मध्ये:
```sql
update profiles set role = 'admin', is_registered = true where mobile_number = '9876543210';
```
आता तो नंबर `/admin/login` वरून लॉगिन करू शकतो.

## सर्व SQL फाईल्स (या क्रमाने Supabase मध्ये run करा)

1. `supabase/schema.sql`
2. `supabase/rls_policies.sql`
3. `supabase/phase2_functions.sql`
4. `supabase/phase3_functions.sql`
5. `supabase/phase4_push_and_realtime.sql`

## 🎉 प्रोजेक्ट पूर्ण — Deployment Checklist

1. Supabase project तयार करा, वरील ५ SQL फाईल्स क्रमाने run करा
2. Authentication > Phone provider enable करा + Twilio/MSG91 जोडा
3. `village_neighbors` table मध्ये तुमच्या भागातील शेजारी गावांची यादी भरा (booking assignment साठी आवश्यक)
4. Razorpay account तयार करून keys घ्या
5. `npx web-push generate-vapid-keys` चालवून push keys घ्या
6. वरील एक admin account तयार करा
7. `.env.local` मध्ये सर्व keys भरा, `npm install && npm run build` करून तपासा
8. GitHub वर push करा, Vercel वर import करा, environment variables टाका, Deploy करा
9. PWA icons (`/public/icons/icon-192.png`, `icon-512.png`, maskable versions) स्वतःचा logo वापरून तयार करा — सध्या placeholder path आहेत

## माहितीसाठी — काय स्वतः तपासावे लागेल

- हा कोड production-grade architecture सह लिहिला आहे, पण **actual Supabase/Razorpay/SMS keys शिवाय चालणार नाही** — वरील checklist प्रमाणे सर्व जोडल्यावरच पूर्ण कार्यरत होईल
- मोठ्या प्रमाणावर वापरण्याआधी एका छोट्या गटासोबत (उदा. एक गाव) टेस्ट करून घ्या
- Play Store वर टाकण्यासाठी हे PWA ला TWA (Trusted Web Activity) मध्ये wrap करावे लागेल — त्यासाठी वेगळे मार्गदर्शन हवे असल्यास सांगा
