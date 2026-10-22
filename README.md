# Fawaz Professional Links & Portfolio 🚀
### نظام متكامل للروابط المهنية والسيرة الذاتية التفاعلية (ثنائي اللغة: عربي / English)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D22.0.0-green.svg)](https://nodejs.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?logo=vite)](https://vitejs.dev/)

---

## 📖 نظرة عامة / Overview

**Fawaz Professional Links** هو تطبيق ويب حديث، عالي الأداء وثنائي اللغة (عربي / إنجليزي)، صُمم لتقديم حضور مهني متكامل للمهندس **فواز الجبيلي**. يجمع النظام بين صفحة روابط احترافية (LinkTree)، مستعرض مدمج للسيرة الذاتية (PDF Viewer)، نموذج طلب تواصل فوري مربوط ببوت تيليجرام، وتكامل ذكي مع مساعد بالذكاء الاصطناعي (Gemini).

A modern, high-performance, bilingual (Arabic & English) professional link hub and portfolio platform for **Fawaz Al-Jubaili**. Features an interactive link showcase, embedded PDF CV viewer, direct contact requests with instant Telegram notifications, and AI assistant capabilities.

---

## ✨ المميزات الرئيسية / Key Features

- 🌐 **دعم كامل للغتين (Bilingual RTL/LTR)**: واجهة عربية أصيلة مع دعم التبديل السلس للغة الإنجليزية وتناسق كامل للاتجاهين.
- 📱 **إشعارات تيليجرام فورية (Instant Telegram Alerts)**: استلام طلبات التواصل مباشرة على بوت تيليجرام مع دعم صيغتي HTML والنص العادي البديل (Fallback).
- 📄 **مستعرض سيرة ذاتية مدمج (Dedicated PDF Viewer)**: استعراض وتحميل السيرة الذاتية بسلاسة وسرعة على جميع الأجهزة دون الحاجة لبرامج خارجية.
- 🤖 **مساعد ذكي مدعوم بـ Gemini (AI Assistant)**: إمكانية التفاعل وطرح الأسئلة حول الخبرات والمهارات المهنية.
- ⚡ **أداء فائق وبناء حديث (High Performance)**: مبني باستخدام Vite و TypeScript و Tailwind CSS لضمان سرعة تحميل فائقة وتجاوب تام.
- ☁️ **جاهز للنشر على Cloudflare Pages**: دعم مسارات الواجهة البرمجية (Serverless API) عبر `functions/api/*` دون الحاجة لخوادم مخصصة.
- 🔒 **أمان متقدم وخالٍ من الأسرار المكشوفة**: التزام صارم بأعلى معايير الأمان (Secret-Free Codebase) وحماية Push Protection لـ GitHub.

---

## 🛠️ التقنيات المستخدمة / Tech Stack

- **Frontend**: HTML5, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Build Tool**: Vite 6, Node.js 22+.
- **Serverless Backend (Cloudflare Pages)**: Cloudflare Pages Functions (`/functions/api/contact-request.ts`).
- **Local Dev Server**: Node.js, Express, TSX, Axios, Multer.
- **Integrations**:
  - **Telegram Bot API**: لإرسال التنبيهات الفورية للمدير/المستخدم.
  - **Google Gemini API**: لتشغيل المساعد الذكي الخاص بالملف المهني.
  - **Hugging Face Datasets (Optional)**: لعمل نسخ احتياطي سحابي لطلبات التواصل (اختياري).

---

## 📁 هيكلية المشروع / Project Structure

```plaintext
├── functions/
│   └── api/
│       ├── contact-request.ts   # دالة معالجة طلبات التواصل وتيليجرام على Cloudflare
│       └── upload-cv.ts         # دالة رفع السيرة الذاتية
├── public/
│   ├── assets/                  # أصول وملفات عامة
│   ├── fawaz_aljubaili_cv.pdf   # ملف السيرة الذاتية الرسمي
│   └── _headers                 # ترويسات الأمان لـ Cloudflare Pages
├── assets/                      # المرفقات والملفات الثابتة
├── index.html                   # الصفحة الرئيسية وملف الروابط
├── pdf_viewer.html              # مستعرض السيرة الذاتية
├── cms.ts                       # وظائف إدارة المحتوى والنماذج بالواجهة
├── ai.ts                        # تكامل المساعد الذكي والمخططات (Zod)
├── server.ts                    # خادم التطوير المحلي (Local Dev Server)
├── build.js                     # سكربت البناء لتهيئة مجلد dist للنشر
├── wrangler.jsonc               # إعدادات النشر على Cloudflare
├── vite.config.ts               # إعدادات Vite
├── package.json                 # التبعيات وسكربتات التشغيل
├── LICENSE                      # ترخيص MIT مفتوح المصدر
└── README.md                    # توثيق المشروع
```

---

## ⚙️ متطلبات التشغيل والمتغيرات / Environment Variables

قم بإنشاء ملف `.env` في المجلد الرئيسي بالاعتماد على `.env.example`:

```bash
# Telegram Bot Integration (Required for Notifications)
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_CHAT_ID="your_telegram_chat_id"

# Google Gemini API Key (Required for AI Assistant)
GEMINI_API_KEY="your_gemini_api_key"

# Hugging Face Dataset Backup (Optional)
HF_TOKEN="your_hugging_face_token"
HF_DATASET="username/dataset_name"
```

> **ملاحظة أمنية هامة**: لا ترفع ملف `.env` إلى مستودع GitHub أبداً؛ الملف مدرج بالفعل في `.gitignore` لمنع أي تسريب للمفاتيح.

---

## 🚀 البدء والتشغيل المحلي / Getting Started

### 1. تثبيت الحزم (Dependencies):
```bash
npm install
```

### 2. تشغيل السيرفر المحلي للتطوير:
```bash
npm run dev
```
سيعمل التطبيق محلياً على: `http://localhost:3000`

### 3. بناء المشروع للإنتاج:
```bash
npm run build
```
سيتم تجميع أصول الموقع داخل مجلد `dist/` مع تجهيز صفحات التوجيه `200.html` و `404.html`.

### 4. فحص الأنماط والـ TypeScript:
```bash
npm run lint
```

---

## 🌐 النشر على Cloudflare Pages / Deployment

المشروع مُهيأ للعمل مباشرة مع **Cloudflare Pages**:

1. اربط مستودع GitHub بحسابك على [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. اختر **Create application** > **Pages** > **Connect to Git**.
3. اضبط إعدادات البناء (Build Settings):
   - **Framework preset**: `None` / `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js Version**: `22` (محددة في `.node-version` و `.nvmrc`)
4. في قسم **Settings** > **Environment variables** في Cloudflare، أضف المتغيرات التالية:
   - `TELEGRAM_BOT_TOKEN` (كقيمة مشفرة Secret)
   - `TELEGRAM_CHAT_ID`
   - `GEMINI_API_KEY` (كقيمة مشفرة Secret)

---

## 📄 الترخيص / License

هذا المشروع مرخص ومتاح للاستخدام بموجب ترخيص **MIT** المفتوح المصدر.  
راجع ملف [LICENSE](LICENSE) لمزيد من التفاصيل.

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
