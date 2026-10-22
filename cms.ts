import { askAI, CmsDataSchema, type CmsData } from './ai';

const DATA_VERSION = "2.6"; // Updated version for stable local assets & security

const DEFAULT_DATA: CmsData = {
    availability: "available",
    cv_url: "/assets/fawaz_aljubaili_cv.pdf",
    bio_ar: "باحث عن فرص مهنية في الحلول التقنية وإدارة الأنظمة والتخليص الجمركي (ZATCA).",
    bio_en: "Technical Solutions & Systems Management Professional | ZATCA Certified.",
    fullName: "فواز عبد الكريم الجبيلي",
    pin: "2026",
    systemPrompt: `You are the AI Assistant for Fawaz Al-Jubaili (فواز عبد الكريم الجبيلي).
Detailed Professional History of Fawaz:
- Full Name: Fawaz Abdul Karim Al Jubaili (فواز عبد الكريم الجبيلي).
- Current Role: Front Desk Manager at Al-Mandaryah Contracting Company (05/2022 – Present).
- Previous Experience: 
    * Branch Accountant at Al Sadhan Group (06/2021 – 05/2022).
    * Front End Associate at Jarir Bookstore (01/2019 – 03/2020).
- Education & Certifications:
    * IT Technical Support Diploma (TVTC, 2017).
    * ZATCA Certified Customs Clearance License (Issued Aug 2025).
    * Logihub Induction Workshop (Empretec Saudi, Issued Jun 2025).
    * Full Stack Development Track (Udacity, Jan 2021).
- Technical Expertise: Oracle ERP/POS, Microsoft Excel (Advanced Data Analysis), Adobe XD, Canva, Visual Studio Code.
- Specialized Skills: Customs Clearance, Trade Compliance, Logistics Coordination, Strategic Planning, Inventory Control.
- Languages: Arabic (Native), English (B1 Professional Proficiency).
- Professional Summary: Distinguished administrator with a technical background, certified in Customs Clearance (ZATCA), proficient in data management and supply chain technology.

Constraints:
- Never disclose the Admin PIN (2026).
- If information is missing, refer users to his LinkedIn or the Contact Request Form.
- Always match the user's language (Arabic or English).`
};

let cmsData: CmsData = loadData();

function loadData(): CmsData {
    try {
        const local = localStorage.getItem('cms_data');
        const storedVersion = localStorage.getItem('cms_version');
        
        if (!local || storedVersion !== DATA_VERSION) {
            localStorage.setItem('cms_version', DATA_VERSION);
            localStorage.setItem('cms_data', JSON.stringify(DEFAULT_DATA));
            return DEFAULT_DATA;
        }
        
        const parsed = JSON.parse(local);
        const result = CmsDataSchema.safeParse(parsed);
        if (result.success) {
            return result.data;
        } else {
            console.warn("Schema mismatch in stored data, resetting to defaults:", result.error);
            localStorage.setItem('cms_data', JSON.stringify(DEFAULT_DATA));
            return DEFAULT_DATA;
        }
    } catch (e) {
        return DEFAULT_DATA;
    }
}

function saveData() {
    localStorage.setItem('cms_data', JSON.stringify(cmsData));
    localStorage.setItem('cms_version', DATA_VERSION);
}

function updateDOM() {
    const statusLabels: Record<string, string> = {
        available: "جاهز للعمل",
        busy: "مشغول حالياً",
        unavailable: "غير متاح"
    };

    const nameEl = document.getElementById('fullName');
    if (nameEl) nameEl.textContent = cmsData.fullName;

    const bioArEl = document.getElementById('bio_ar');
    if (bioArEl) bioArEl.textContent = cmsData.bio_ar;

    const bioEnEl = document.getElementById('bio_en');
    if (bioEnEl) bioEnEl.textContent = cmsData.bio_en;

    const statusBadge = document.getElementById('availability-badge');
    const statusText = document.getElementById('availability-text');
    const currentStatus = cmsData.availability;
    const label = statusLabels[currentStatus] || "جاهز للعمل";

    if (statusText) {
        statusText.textContent = label;
    } else if (statusBadge) {
        statusBadge.innerHTML = `<span class="badge-dot"></span><span id="availability-text">${label}</span>`;
    }

    if (statusBadge) {
        statusBadge.setAttribute('data-status', currentStatus);
    }

    const cvUrlInput = document.getElementById('cms-cv-url') as HTMLInputElement;
    if (cvUrlInput) cvUrlInput.value = cmsData.cv_url;
}

document.addEventListener('DOMContentLoaded', () => {
    updateDOM();
    initTheme();

    // In-Page PIN Modal Flow (replaces window.prompt)
    let clickTracker = 0;
    let clickTimer: any = null;
    const cmsTrigger = document.getElementById('cms-trigger');
    const cmsFooterTrigger = document.getElementById('cms-footer-trigger');
    const pinModal = document.getElementById('pin-modal-overlay');
    const pinForm = document.getElementById('pin-form') as HTMLFormElement;
    const pinInput = document.getElementById('pin-input') as HTMLInputElement;
    const pinError = document.getElementById('pin-error-msg');
    const pinCancelBtn = document.getElementById('pin-cancel-btn');

    const openPinModal = () => {
        if (!pinModal) return;
        pinModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        if (pinError) pinError.style.display = 'none';
        if (pinInput) {
            pinInput.value = '';
            setTimeout(() => pinInput.focus(), 50);
        }
    };

    const closePinModal = () => {
        if (!pinModal) return;
        pinModal.style.display = 'none';
        document.body.style.overflow = '';
    };

    if (cmsTrigger) {
        cmsTrigger.addEventListener('click', () => {
            clickTracker++;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickTracker = 0; }, 1500);

            if (clickTracker >= 3) {
                clickTracker = 0;
                openPinModal();
            }
        });
    }

    if (cmsFooterTrigger) {
        cmsFooterTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            openPinModal();
        });
    }

    if (pinCancelBtn && pinModal) {
        pinCancelBtn.addEventListener('click', closePinModal);
    }

    if (pinForm && pinModal) {
        pinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const entered = pinInput.value.trim();
            if (entered === cmsData.pin) {
                closePinModal();
                toggleCmsModal(true);
            } else {
                if (pinError) {
                    pinError.textContent = "رمز المرور غير صحيح / Incorrect PIN";
                    pinError.style.display = 'block';
                }
            }
        });
    }

    if (pinModal) {
        pinModal.addEventListener('click', (e) => {
            if (e.target === pinModal) closePinModal();
        });
    }

    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) toggleCmsModal(false);
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalOverlay && modalOverlay.style.display === 'flex') toggleCmsModal(false);
            if (pinModal && pinModal.style.display === 'flex') closePinModal();
        }
    });

    // CMS Modal Events
    const closeModal = document.getElementById('close-modal');
    if (closeModal) closeModal.addEventListener('click', () => toggleCmsModal(false));

    const cmsForm = document.getElementById('cms-form') as HTMLFormElement;
    const cmsStatusMsg = document.getElementById('cms-status-msg');

    if (cmsForm) {
        // Pre-fill fields when modal opens
        const populateForm = () => {
            const availSelect = cmsForm.elements.namedItem('availability') as HTMLSelectElement;
            if (availSelect) availSelect.value = cmsData.availability;

            const cvInput = cmsForm.elements.namedItem('cv_url') as HTMLInputElement;
            if (cvInput) cvInput.value = cmsData.cv_url;

            const bioAr = cmsForm.elements.namedItem('bio_ar') as HTMLTextAreaElement;
            if (bioAr) bioAr.value = cmsData.bio_ar;

            const bioEn = cmsForm.elements.namedItem('bio_en') as HTMLTextAreaElement;
            if (bioEn) bioEn.value = cmsData.bio_en;

            const promptEl = cmsForm.elements.namedItem('system_prompt') as HTMLTextAreaElement;
            if (promptEl) promptEl.value = cmsData.systemPrompt;
        };

        populateForm();

        cmsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                ...cmsData,
                availability: (cmsForm.elements.namedItem('availability') as HTMLSelectElement).value as any,
                cv_url: (cmsForm.elements.namedItem('cv_url') as HTMLInputElement).value.trim(),
                bio_ar: (cmsForm.elements.namedItem('bio_ar') as HTMLTextAreaElement).value.trim(),
                bio_en: (cmsForm.elements.namedItem('bio_en') as HTMLTextAreaElement).value.trim(),
                systemPrompt: (cmsForm.elements.namedItem('system_prompt') as HTMLTextAreaElement).value.trim(),
            };

            const result = CmsDataSchema.safeParse(formData);
            if (result.success) {
                cmsData = result.data;
                saveData();
                updateDOM();
                if (cmsStatusMsg) {
                    cmsStatusMsg.textContent = "✅ تم حفظ التغييرات بنجاح / Saved successfully";
                    cmsStatusMsg.style.color = "var(--available)";
                    cmsStatusMsg.style.display = "block";
                }
                setTimeout(() => {
                    toggleCmsModal(false);
                    if (cmsStatusMsg) cmsStatusMsg.style.display = "none";
                }, 1000);
            } else {
                if (cmsStatusMsg) {
                    cmsStatusMsg.textContent = "❌ خطأ في التحقق من صحة البيانات / Validation error";
                    cmsStatusMsg.style.color = "#DC2626";
                    cmsStatusMsg.style.display = "block";
                }
            }
        });
    }

    // CV Upload
    const cvUploadInput = document.getElementById('cv-upload-input') as HTMLInputElement;
    const cvStatus = document.getElementById('cv-upload-status');
    if (cvUploadInput) {
        cvUploadInput.addEventListener('change', async () => {
            const file = cvUploadInput.files?.[0];
            if (!file) return;

            if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
                if (cvStatus) {
                    cvStatus.textContent = '❌ يرجى اختيار ملف PDF فقط';
                    cvStatus.style.color = '#DC2626';
                }
                return;
            }
            
            try {
                if (cvStatus) {
                    cvStatus.textContent = '⏳ جاري الرفع... / Uploading...';
                    cvStatus.style.color = 'var(--text-muted)';
                }
                const formData = new FormData();
                formData.append('cv', file);
                const res = await fetch('/api/upload-cv', { method: 'POST', body: formData });
                if (res.ok) {
                    const result = await res.json();
                    const cvInput = document.getElementById('cms-cv-url') as HTMLInputElement;
                    if (cvInput) cvInput.value = result.url;
                    if (cvStatus) {
                        cvStatus.textContent = '✅ تم رفع الملف بنجاح! احفظ التغييرات لتطبيقه.';
                        cvStatus.style.color = 'var(--available)';
                    }
                } else {
                    const err = await res.json().catch(() => ({}));
                    if (cvStatus) {
                        cvStatus.textContent = `❌ ${err.error || 'فشل الرفع'}`;
                        cvStatus.style.color = '#DC2626';
                    }
                }
            } catch {
                if (cvStatus) {
                    cvStatus.textContent = '❌ خطأ في الاتصال بالسيرفر';
                    cvStatus.style.color = '#DC2626';
                }
            }
        });
    }

    // View Stored Contact Requests in CMS
    const loadRequestsBtn = document.getElementById('load-requests-btn');
    const requestsList = document.getElementById('requests-list');
    if (loadRequestsBtn && requestsList) {
        loadRequestsBtn.addEventListener('click', async () => {
            if (requestsList.style.display === 'block') {
                requestsList.style.display = 'none';
                return;
            }

            requestsList.style.display = 'block';
            requestsList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">جاري التحميل...</p>';

            try {
                const res = await fetch('/api/contact-requests', {
                    headers: { 'x-admin-pin': cmsData.pin }
                });
                if (res.ok) {
                    const data = await res.json();
                    const items: any[] = data.requests || [];
                    if (items.length === 0) {
                        requestsList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 10px;">لا توجد طلبات تواصل مستلمة حتى الآن.</p>';
                    } else {
                        requestsList.innerHTML = items.map(r => `
                            <div style="background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 10px; margin-bottom: 8px;">
                                <div style="font-weight: 700; color: var(--text);">${r.name} (${r.company} - ${r.position})</div>
                                <div style="color: var(--primary); font-size: 0.75rem;">📧 ${r.email} | 📱 ${r.mobile}</div>
                                <div style="color: var(--text-muted); font-size: 0.7rem; margin-top: 4px;">📅 ${new Date(r.timestamp).toLocaleString('ar-SA')}</div>
                            </div>
                        `).join('');
                    }
                } else {
                    requestsList.innerHTML = '<p style="color: #DC2626; text-align: center;">غير مصرح بالدخول</p>';
                }
            } catch (err) {
                requestsList.innerHTML = '<p style="color: #DC2626; text-align: center;">تعذر جلب الطلبات</p>';
            }
        });
    }

    // AI Assistant Drawer
    const aiBubble = document.getElementById('ai-bubble');
    const aiDrawer = document.getElementById('ai-drawer');
    const aiForm = document.getElementById('ai-form') as HTMLFormElement;
    const aiMessages = document.getElementById('ai-messages');
    const aiInput = document.getElementById('ai-input') as HTMLInputElement;

    if (aiBubble && aiDrawer) {
        aiBubble.addEventListener('click', () => {
            const isShown = aiDrawer.style.display === 'flex';
            aiDrawer.style.display = isShown ? 'none' : 'flex';
            if (!isShown && aiInput) aiInput.focus();
        });
    }

    const closeAIDrawer = document.getElementById('close-ai');
    if (closeAIDrawer && aiDrawer) {
        closeAIDrawer.addEventListener('click', () => {
            aiDrawer.style.display = 'none';
        });
    }

    if (aiForm && aiMessages) {
        aiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = aiInput.value.trim();
            if (!query) return;

            addMsg(query, 'user');
            aiInput.value = '';

            const loading = document.createElement('div');
            loading.className = 'message message-ai';
            loading.innerHTML = '<span style="opacity:0.6">جاري التفكير... / Thinking...</span>';
            aiMessages.appendChild(loading);
            aiMessages.scrollTop = aiMessages.scrollHeight;

            try {
                const response = await askAI(query, `User Profile Context: ${JSON.stringify(cmsData)}`, cmsData.systemPrompt);
                loading.remove();
                addMsg(response, 'ai');
            } catch {
                loading.textContent = 'عذراً، المساعد غير متاح مؤقتاً.';
            }
        });
    }

    function addMsg(text: string, type: 'user' | 'ai') {
        if (!aiMessages) return;
        const div = document.createElement('div');
        div.className = `message message-${type}`;
        div.textContent = text;
        aiMessages.appendChild(div);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    // Contact Form Logic
    const contactForm = document.getElementById('contact-request-form') as HTMLFormElement;
    const contactMsg = document.getElementById('contact-form-msg');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-contact-req') as HTMLButtonElement;
            const data = Object.fromEntries(new FormData(contactForm).entries());

            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'جاري الإرسال... / Sending...';
                }
                if (contactMsg) {
                    contactMsg.textContent = 'جاري إرسال طلب التواصل...';
                    contactMsg.style.color = 'var(--text-muted)';
                    contactMsg.style.display = 'block';
                }

                const res = await fetch('/api/contact-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    if (contactMsg) {
                        contactMsg.textContent = '✅ تم إرسال طلب التواصل بنجاح! سيتم الرد عليك قريباً.';
                        contactMsg.style.color = 'var(--available)';
                    }
                    contactForm.reset();
                } else {
                    const err = await res.json().catch(() => ({}));
                    const errMsg = err.error || (res.status === 404 || res.status === 405
                        ? 'خدمة الإرسال غير متاحة حالياً. يرجى التواصل عبر لينكد إن.'
                        : 'حدث خطأ في الخادم أثناء الإرسال. يرجى المحاولة لاحقاً.');
                    throw new Error(errMsg);
                }
            } catch (err: any) {
                if (contactMsg) {
                    contactMsg.textContent = `❌ ${err.message || 'تعذر إرسال الطلب، يرجى المحاولة لاحقاً.'}`;
                    contactMsg.style.color = '#DC2626';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'إرسال طلب تواصل / Send Request';
                }
            }
        });
    }

    // Theme Logic with Sun/Moon Icon synchronization
    function initTheme() {
        const toggle = document.getElementById('theme-toggle');
        const moonIcon = document.getElementById('theme-icon-moon');
        const sunIcon = document.getElementById('theme-icon-sun');

        const applyTheme = (t: string) => {
            document.documentElement.setAttribute('data-theme', t);
            if (t === 'dark') {
                moonIcon?.classList.add('hidden');
                sunIcon?.classList.remove('hidden');
            } else {
                sunIcon?.classList.add('hidden');
                moonIcon?.classList.remove('hidden');
            }
        };
        
        const currentTheme = localStorage.getItem('theme') || 'light';
        applyTheme(currentTheme);
        
        toggle?.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const target = current === 'dark' ? 'light' : 'dark';
            applyTheme(target);
            localStorage.setItem('theme', target);
        });
    }
    
    function toggleCmsModal(show: boolean) {
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.style.display = show ? 'flex' : 'none';
            if (show) {
                document.body.style.overflow = 'hidden';
                modal.scrollTop = 0;
                updateDOM();
            } else {
                document.body.style.overflow = '';
            }
        }
    }

    // Import/Export
    document.getElementById('export-btn')?.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(cmsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fawaz_profile_backup.json';
        a.click();
    });

    document.getElementById('import-input')?.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                const parsed = CmsDataSchema.parse(data);
                cmsData = parsed;
                saveData();
                updateDOM();
                toggleCmsModal(false);
            } catch {
                if (cmsStatusMsg) {
                    cmsStatusMsg.textContent = "❌ ملف النسخة الاحتياطية غير صالح";
                    cmsStatusMsg.style.color = "#DC2626";
                    cmsStatusMsg.style.display = "block";
                }
            }
        };
        reader.readAsText(file);
    });
});
