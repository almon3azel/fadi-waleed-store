
/* ==========================================
   FADI WALEED
   TELEGRAM ADMIN BOT
   Version 1.0
========================================== */

"use strict";

require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = String(process.env.ADMIN_ID || "");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

const DATA_PATH = "data.json";

if (!TOKEN || !ADMIN_ID || !GITHUB_TOKEN ||
    !GITHUB_OWNER || !GITHUB_REPO) {
    console.error("ERROR: Missing environment variables in .env");
    process.exit(1);
}

const bot = new TelegramBot(TOKEN, {
    polling: true
});

const sessions = new Map();

const THEMES = [
    "midnight", "gold", "royal", "ocean",
    "emerald", "ruby", "sapphire", "cyber",
    "neon", "crimson", "silver", "ice",
    "sunset", "amethyst", "copper", "forest",
    "pink", "arctic", "obsidian", "royalblue",
    "lavender", "diamond", "orange", "matrix"
];


/* ==========================================
   ADMIN SECURITY
========================================== */

function isAdmin(msg) {
    return String(msg.from?.id) === ADMIN_ID;
}

function checkAdmin(msg) {
    if (!isAdmin(msg)) {
        bot.sendMessage(
            msg.chat.id,
            "⛔ غير مصرح لك باستخدام لوحة التحكم."
        );

        return false;
    }

    return true;
}

function getSession(id) {
    return sessions.get(String(id));
}

function setSession(id, data) {
    sessions.set(String(id), data);
}

function clearSession(id) {
    sessions.delete(String(id));
}


/* ==========================================
   GITHUB API
========================================== */

const githubHeaders = {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28"
};

function githubUrl() {
    return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}`;
}


async function githubRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...githubHeaders,
            ...(options.headers || {})
        }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.message || `GitHub Error ${response.status}`
        );
    }

    return result;
}


async function getStore() {
    const result = await githubRequest(
        `${githubUrl()}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
    );

    const decoded = Buffer.from(
        result.content.replace(/\n/g, ""),
        "base64"
    ).toString("utf8");

    return {
        data: JSON.parse(decoded),
        sha: result.sha
    };
}


async function saveStore(data, sha) {
    const content = Buffer.from(
        JSON.stringify(data, null, 2),
        "utf8"
    ).toString("base64");

    return githubRequest(githubUrl(), {
        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message: "Update FADI WALEED store settings",
            content,
            sha,
            branch: GITHUB_BRANCH
        })
    });
}


async function updateStore(callback) {
    const current = await getStore();

    const updated = await callback(current.data);

    if (updated === false) {
        return false;
    }

    await saveStore(current.data, current.sha);

    return true;
}


/* ==========================================
   MAIN KEYBOARD
========================================== */

function mainKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: "🛍 الخدمات", callback_data: "services" },
                { text: "🔥 العروض", callback_data: "offers" }
            ],
            [
                { text: "🎟 الكوبونات", callback_data: "coupons" },
                { text: "🎨 الثيمات", callback_data: "themes" }
            ],
            [
                { text: "⚙️ إعدادات الموقع", callback_data: "settings" },
                { text: "🧩 أقسام الموقع", callback_data: "sections" }
            ],
            [
                { text: "⭐ التقييمات", callback_data: "reviews" },
                { text: "❓ الأسئلة الشائعة", callback_data: "faqs" }
            ],
            [
                { text: "📊 الإحصائيات", callback_data: "stats" },
                { text: "🔄 تحديث البيانات", callback_data: "refresh" }
            ],
            [
                { text: "❌ إلغاء العملية", callback_data: "cancel" }
            ]
        ]
    };
}


async function showMain(chatId) {
    clearSession(chatId);

    await bot.sendMessage(
        chatId,
        "👑 FADI WALEED\n\n" +
        "مرحباً بك في لوحة التحكم الرئيسية.\n\n" +
        "اختر القسم الذي تريد إدارته:",
        {
            reply_markup: mainKeyboard()
        }
    );
}


/* ==========================================
   UTILITY
========================================== */

function backButton() {
    return {
        inline_keyboard: [
            [
                { text: "⬅️ الرئيسية", callback_data: "home" }
            ]
        ]
    };
}


async function ask(chatId, message, session) {
    setSession(chatId, session);

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            force_reply: true,
            selective: true
        }
    });
}


async function getData(chatId) {
    try {
        const result = await getStore();
        return result.data;
    } catch (error) {
        await bot.sendMessage(
            chatId,
            "❌ تعذر تحميل بيانات GitHub:\n" + error.message
        );

        return null;
    }
}


async function sendSaved(chatId) {
    await bot.sendMessage(
        chatId,
        "✅ تم حفظ التعديلات بنجاح على GitHub.\n\n" +
        "قد يستغرق ظهورها على الموقع بعض الوقت حتى يكتمل النشر."
    );
}


/* ==========================================
   CALLBACK HANDLER
========================================== */

bot.on("callback_query", async query => {
    const chatId = query.message.chat.id;
    const userId = String(query.from.id);
    const action = query.data;

    if (userId !== ADMIN_ID) {
        await bot.answerCallbackQuery(query.id, {
            text: "غير مصرح لك",
            show_alert: true
        });
        return;
    }

    await bot.answerCallbackQuery(query.id);

    try {
        if (action === "home") {
            await showMain(chatId);
            return;
        }

        if (action === "cancel") {
            clearSession(userId);

            await bot.sendMessage(
                chatId,
                "تم إلغاء العملية.",
                { reply_markup: mainKeyboard() }
            );

            return;
        }

        if (action === "refresh") {
            const data = await getData(chatId);

            if (data) {
                await bot.sendMessage(
                    chatId,
                    "✅ بيانات المتجر متاحة ومتصلة بـ GitHub.",
                    { reply_markup: mainKeyboard() }
                );
            }

            return;
        }

        if (action === "services") {
            await showServices(chatId);
            return;
        }

        if (action === "offers") {
            await showOffers(chatId);
            return;
        }

        if (action === "coupons") {
            await showCoupons(chatId);
            return;
        }

        if (action === "themes") {
            await showThemes(chatId);
            return;
        }

        if (action.startsWith("theme:")) {
            await changeTheme(chatId, action.split(":")[1]);
            return;
        }

        if (action === "settings") {
            await showSettings(chatId);
            return;
        }

        if (action.startsWith("setting:")) {
            await editSetting(chatId, action.split(":")[1]);
            return;
        }

        if (action === "sections") {
            await showSections(chatId);
            return;
        }

        if (action.startsWith("section:")) {
            await toggleSection(chatId, action.split(":")[1]);
            return;
        }

        if (action === "reviews") {
            await showReviews(chatId);
            return;
        }

        if (action === "faqs") {
            await showFAQs(chatId);
            return;
        }

        if (action.startsWith("add:")) {
            await startAdd(chatId, action.split(":")[1]);
            return;
        }

        if (action.startsWith("delete:")) {
            const [, type, id] = action.split(":");

            await deleteItem(chatId, type, id);
            return;
        }

        if (action.startsWith("toggle:")) {
            const [, type, id] = action.split(":");

            await toggleItem(chatId, type, id);
            return;
        }

        if (action.startsWith("edit:")) {
            const [, type, id] = action.split(":");

            await startEdit(chatId, type, id);
            return;
        }

        if (action === "stats") {
            await showStats(chatId);
            return;
        }

    } catch (error) {
        console.error(error);

        await bot.sendMessage(
            chatId,
            "❌ حدث خطأ:\n" + error.message
        );
    }
});


/* ==========================================
   SERVICES MANAGEMENT
========================================== */

async function showServices(chatId) {
    const data = await getData(chatId);

    if (!data) return;

    const rows = [];

    data.services.forEach(service => {
        rows.push([
            {
                text: `${service.active ? "🟢" : "🔴"} ${service.name}`,
                callback_data: `edit:services:${service.id}`
            },
            {
                text: "🗑",
                callback_data: `delete:services:${service.id}`
            }
        ]);
    });

    rows.push([
        { text: "➕ إضافة خدمة", callback_data: "add:services" }
    ]);

    rows.push([
        { text: "⬅️ الرئيسية", callback_data: "home" }
    ]);

    await bot.sendMessage(
        chatId,
        "🛍 إدارة الخدمات\n\nعدد الخدمات: " +
        data.services.length,
        {
            reply_markup: { inline_keyboard: rows }
        }
    );
}


/* ==========================================
   OFFERS MANAGEMENT
========================================== */

async function showOffers(chatId) {
    const data = await getData(chatId);

    if (!data) return;

    const rows = [];

    data.offers.forEach(offer => {
        rows.push([
            {
                text: `${offer.active ? "🟢" : "🔴"} ${offer.name}`,
                callback_data: `edit:offers:${offer.id}`
            },
            {
                text: "🗑",
                callback_data: `delete:offers:${offer.id}`
            }
        ]);
    });

    rows.push([
        { text: "➕ إضافة عرض", callback_data: "add:offers" }
    ]);

    rows.push([
        { text: "⬅️ الرئيسية", callback_data: "home" }
    ]);

    await bot.sendMessage(
        chatId,
        "🔥 إدارة العروض",
        { reply_markup: { inline_keyboard: rows } }
    );
}


/* ==========================================
   COUPONS MANAGEMENT
========================================== */

async function showCoupons(chatId) {
    const data = await getData(chatId);

    if (!data) return;

    const rows = [];

    data.coupons.forEach(coupon => {
        rows.push([
            {
                text: `${coupon.code} — ${coupon.value}%`,
                callback_data: `edit:coupons:${coupon.id}`
            },
            {
                text: "🗑",
                callback_data: `delete:coupons:${coupon.id}`
            }
        ]);
    });

    rows.push([
        { text: "➕ إضافة كوبون", callback_data: "add:coupons" }
    ]);

    rows.push([
        { text: "⬅️ الرئيسية", callback_data: "home" }
    ]);

    await bot.sendMessage(
        chatId,
        "🎟 إدارة الكوبونات",
        { reply_markup: { inline_keyboard: rows } }
    );
}


/* ==========================================
   THEMES MANAGEMENT
========================================== */

async function showThemes(chatId) {
    const rows = [];

    for (let i = 0; i < THEMES.length; i += 2) {
        rows.push(
            THEMES.slice(i, i + 2).map(theme => ({
                text: theme,
                callback_data: `theme:${theme}`
            }))
        );
    }

    rows.push([
        { text: "⬅️ الرئيسية", callback_data: "home" }
    ]);

    await bot.sendMessage(
        chatId,
        "🎨 اختر الثيم الذي تريده:\n\n" +
        "عدد الثيمات: 24",
        {
            reply_markup: { inline_keyboard: rows }
        }
    );
}


async function changeTheme(chatId, theme) {
    if (!THEMES.includes(theme)) return;

    await updateStore(data => {
        data.config.theme = theme;
    });

    await sendSaved(chatId);
    await showThemes(chatId);
}


/* ==========================================
   SETTINGS MANAGEMENT
========================================== */

async function showSettings(chatId) {
    const rows = [
        [{ text: "اسم الموقع", callback_data: "setting:siteName" }],
        [{ text: "اللقب", callback_data: "setting:brandTitle" }],
        [{ text: "الإعلان", callback_data: "setting:announcement" }],
        [{ text: "رابط تيليجرام", callback_data: "setting:telegram" }],
        [{ text: "وصف الرئيسية", callback_data: "setting:heroDescription" }],
        [{ text: "عنوان الرئيسية", callback_data: "setting:heroTitle" }],
        [{ text: "وصف من أنا", callback_data: "setting:aboutDescription" }],
        [{ text: "عنوان قسم الخدمات", callback_data: "setting:servicesTitle" }],
        [{ text: "⬅️ الرئيسية", callback_data: "home" }]
    ];

    await bot.sendMessage(
        chatId,
        "⚙️ إعدادات الموقع\n\nاختر الإعداد الذي تريد تغييره:",
        { reply_markup: { inline_keyboard: rows } }
    );
}


const SETTINGS_MAP = {
    siteName: ["config", "siteName"],
    brandTitle: ["config", "brandTitle"],
    announcement: ["config", "announcement"],
    telegram: ["config", "telegram"],
    heroDescription: ["config", "hero", "description"],
    heroTitle: ["config", "hero", "title"],
    aboutDescription: ["config", "about", "description"],
    servicesTitle: ["config", "sections", "services"]
};


async function editSetting(chatId, setting) {
    const path = SETTINGS_MAP[setting];

    if (!path) return;

    await ask(
        chatId,
        "✏️ أرسل القيمة الجديدة:",
        {
            type: "setting",
            key: setting
        }
    );
}


/* ==========================================
   SECTIONS MANAGEMENT
========================================== */

const SECTION_MAP = {
    services: "showServices",
    offers: "showOffers",
    reviews: "showReviews",
    faq: "showFAQ",
    about: "showAbout"
};


async function showSections(chatId) {
    const data = await getData(chatId);

    if (!data) return;

    const rows = [];

    Object.entries(SECTION_MAP).forEach(([name, key]) => {
        const enabled = data.config.settings[key];

        rows.push([
            {
                text: `${enabled ? "🟢" : "🔴"} ${name}`,
                callback_data: `section:${name}`
            }
        ]);
    });

    rows.push([
        { text: "⬅️ الرئيسية", callback_data: "home" }
    ]);

    await bot.sendMessage(
        chatId,
        "🧩 التحكم في أقسام الموقع\n\n" +
        "اضغط على القسم لتشغيله أو إخفائه.",
        { reply_markup: { inline_keyboard: rows } }
    );
}


async function toggleSection(chatId, section) {
    const key = SECTION_MAP[section];

    if (!key) return;

    await updateStore(data => {
        data.config.settings[key] =
            !data.config.settings[key];
    });

    await sendSaved(chatId);
    await showSections(chatId);
}


/* ==========================================
   REVIEWS MANAGEMENT
========================================== */

async function showReviews(chatId) {
    const data = await getData(chatId);

    if (!data) return;

    const rows = [];

    data.reviews.forEach(review => {
        rows.push([
            {
                text: `${review.name} — ${review.rating}⭐`,
                callback_data: `edit:reviews:${review.id}`
            },
            {
                text: "🗑",
                callback_data: `delete:reviews:${review.id}`
            }
        ]);
    });

    rows.push([
        { text: "➕ إضافة تقييم", callback_data: "add:reviews" }
    ]);

    rows.push([
        { text: "⬅️ الرئيسية", callback_data: "home" }
    ]);

    await bot.sendMessage(
        chatId,
        "⭐ إدارة التقييمات",
        { reply_markup: { inline_keyboard: rows } }
    );
}


/* ==========================================
   FAQ MANAGEMENT
========================================== */

async function showFAQs(chatId) {
    const data = await getData(chatId);

    if (!data) return;

    const rows = [];

    data.faqs.forEach(faq => {
        rows.push([
            {
                text: faq.question.substring(0, 40),
                callback_data: `edit:faqs:${faq.id}`
            },
            {
                text: "🗑",
                callback_data: `delete:faqs:${faq.id}`
            }
        ]);
    });

    rows.push([
        { text: "➕ إضافة سؤال", callback_data: "add:faqs" }
    ]);

    rows.push([
        { text: "⬅️ الرئيسية", callback_data: "home" }
    ]);

    await bot.sendMessage(
        chatId,
        "❓ إدارة الأسئلة الشائعة",
        { reply_markup: { inline_keyboard: rows } }
    );
}


/* ==========================================
   ADD NEW ITEMS
========================================== */

const ADD_FIELDS = {
    services: [
        ["name", "أرسل اسم الخدمة"],
        ["description", "أرسل وصف الخدمة"],
        ["category", "أرسل تصنيف الخدمة"],
        ["price", "أرسل السعر بالأرقام فقط"]
    ],

    offers: [
        ["name", "أرسل اسم العرض"],
        ["description", "أرسل وصف العرض"],
        ["category", "أرسل تصنيف العرض"],
        ["price", "أرسل السعر"]
    ],

    coupons: [
        ["code", "أرسل كود الكوبون"],
        ["value", "أرسل نسبة الخصم بالأرقام"]
    ],

    reviews: [
        ["name", "أرسل اسم العميل"],
        ["text", "أرسل نص التقييم"],
        ["rating", "أرسل التقييم من 1 إلى 5"]
    ],

    faqs: [
        ["question", "أرسل السؤال"],
        ["answer", "أرسل الإجابة"]
    ]
};


async function startAdd(chatId, type) {
    if (!ADD_FIELDS[type]) return;

    setSession(chatId, {
        type: "add",
        collection: type,
        step: 0,
        item: {}
    });

    await bot.sendMessage(
        chatId,
        "➕ إضافة عنصر جديد\n\n" +
        ADD_FIELDS[type][0][1] +
        "\n\nاكتب /cancel للإلغاء."
    );
}


/* ==========================================
   EDIT ITEMS
========================================== */

async function startEdit(chatId, type, id) {
    const collections = [
        "services",
        "offers",
        "coupons",
        "reviews",
        "faqs"
    ];

    if (!collections.includes(type)) return;

    const data = await getData(chatId);

    if (!data) return;

    const item = data[type].find(x => x.id === id);

    if (!item) {
        await bot.sendMessage(chatId, "العنصر غير موجود.");
        return;
    }

    const fields = Object.keys(item).filter(key =>
        !["id", "active"].includes(key)
    );

    const rows = fields.map(field => [{
        text: `تعديل ${field}`,
        callback_data: `field:${type}:${id}:${field}`
    }]);

    rows.push([
        {
            text: item.active === false
                ? "🟢 تفعيل العنصر"
                : "🔴 إيقاف العنصر",
            callback_data: `toggle:${type}:${id}`
        }
    ]);

    rows.push([
        { text: "⬅️ رجوع", callback_data: type }
    ]);

    await bot.sendMessage(
        chatId,
        `✏️ تعديل العنصر:\n${item.name || item.code || item.question}`,
        { reply_markup: { inline_keyboard: rows } }
    );
}


/* ==========================================
   EDIT FIELD CALLBACK
========================================== */

bot.on("callback_query", async query => {
    if (String(query.from.id) !== ADMIN_ID) return;

    if (!query.data.startsWith("field:")) return;

    const chatId = query.message.chat.id;

    const [, type, id, field] = query.data.split(":");

    await bot.answerCallbackQuery(query.id);

    setSession(chatId, {
        type: "edit",
        collection: type,
        id,
        field
    });

    await bot.sendMessage(
        chatId,
        `✏️ أرسل القيمة الجديدة للحقل: ${field}`
    );
});


/* ==========================================
   DELETE ITEMS
========================================== */

async function deleteItem(chatId, type, id) {
    const allowed = [
        "services",
        "offers",
        "coupons",
        "reviews",
        "faqs"
    ];

    if (!allowed.includes(type)) return;

    await updateStore(data => {
        data[type] = data[type].filter(
            item => item.id !== id
        );
    });

    await sendSaved(chatId);

    const views = {
        services: showServices,
        offers: showOffers,
        coupons: showCoupons,
        reviews: showReviews,
        faqs: showFAQs
    };

    await views[type](chatId);
}


/* ==========================================
   TOGGLE ITEM
========================================== */

async function toggleItem(chatId, type, id) {
    const allowed = [
        "services",
        "offers",
        "reviews",
        "faqs"
    ];

    if (!allowed.includes(type)) return;

    await updateStore(data => {
        const item = data[type].find(x => x.id === id);

        if (item) {
            item.active = item.active === false;
        }
    });

    await sendSaved(chatId);
    await startEdit(chatId, type, id);
}


/* ==========================================
   STATISTICS
========================================== */

async function showStats(chatId) {
    const data = await getData(chatId);

    if (!data) return;

    const activeServices = data.services.filter(
        x => x.active !== false
    ).length;

    const activeOffers = data.offers.filter(
        x => x.active !== false
    ).length;

    const activeCoupons = data.coupons.filter(
        x => x.active !== false
    ).length;

    const message = [
        "📊 إحصائيات المتجر",
        "",
        `🛍 الخدمات: ${data.services.length}`,
        `🟢 الخدمات النشطة: ${activeServices}`,
        `🔥 العروض: ${data.offers.length}`,
        `🎟 الكوبونات: ${activeCoupons}`,
        `⭐ التقييمات: ${data.reviews.length}`,
        `❓ الأسئلة: ${data.faqs.length}`,
        `🎨 الثيم الحالي: ${data.config.theme}`
    ].join("\n");

    await bot.sendMessage(
        chatId,
        message,
        { reply_markup: backButton() }
    );
}


/* ==========================================
   TEXT INPUT HANDLER
========================================== */

bot.on("message", async msg => {
    if (!checkAdmin(msg)) return;

    if (!msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (text === "/start") {
        await showMain(chatId);
        return;
    }

    if (text === "/cancel") {
        clearSession(chatId);

        await bot.sendMessage(
            chatId,
            "تم إلغاء العملية.",
            { reply_markup: mainKeyboard() }
        );

        return;
    }

    if (text === "/menu") {
        await showMain(chatId);
        return;
    }

    const session = getSession(chatId);

    if (!session) return;

    try {
        /* SETTINGS */

        if (session.type === "setting") {
            const path = SETTINGS_MAP[session.key];

            await updateStore(data => {
                let target = data;

                for (let i = 0; i < path.length - 1; i++) {
                    target = target[path[i]];
                }

                target[path[path.length - 1]] = text;
            });

            clearSession(chatId);

            await sendSaved(chatId);
            await showSettings(chatId);

            return;
        }


        /* ADD ITEM */

        if (session.type === "add") {
            const fields = ADD_FIELDS[session.collection];

            const current = fields[session.step];

            if (current[0] === "price" ||
                current[0] === "value" ||
                current[0] === "rating") {

                const number = Number(text);

                if (!Number.isFinite(number) || number < 0) {
                    await bot.sendMessage(
                        chatId,
                        "❌ أرسل رقماً صحيحاً."
                    );
                    return;
                }

                if (current[0] === "rating" && number > 5) {
                    await bot.sendMessage(
                        chatId,
                        "التقييم يجب أن يكون من 1 إلى 5."
                    );
                    return;
                }

                session.item[current[0]] = number;

            } else {
                session.item[current[0]] = text;
            }

            session.step++;

            if (session.step < fields.length) {
                setSession(chatId, session);

                await bot.sendMessage(
                    chatId,
                    fields[session.step][1]
                );

                return;
            }

            const item = {
                id: `${session.collection}_${Date.now()}`,
                ...session.item,
                active: true
            };

            if (session.collection === "coupons") {
                item.code = item.code.toUpperCase();
                item.type = "percentage";
                item.minimum = 0;
            }

            if (session.collection === "services" ||
                session.collection === "offers") {
                item.icon = "✦";
            }

            await updateStore(data => {
                data[session.collection].push(item);
            });

            const type = session.collection;

            clearSession(chatId);

            await sendSaved(chatId);

            const views = {
                services: showServices,
                offers: showOffers,
                coupons: showCoupons,
                reviews: showReviews,
                faqs: showFAQs
            };

            await views[type](chatId);

            return;
        }


        /* EDIT ITEM FIELD */

        if (session.type === "edit") {
            const { collection, id, field } = session;

            const numericFields = [
                "price",
                "value",
                "rating",
                "minimum"
            ];

            let value = text;

            if (numericFields.includes(field)) {
                value = Number(text);

                if (!Number.isFinite(value) || value < 0) {
                    await bot.sendMessage(
                        chatId,
                        "❌ أرسل رقماً صحيحاً."
                    );
                    return;
                }

                if (field === "rating" && value > 5) {
                    await bot.sendMessage(
                        chatId,
                        "التقييم يجب أن يكون من 1 إلى 5."
                    );
                    return;
                }
            }

            if (field === "code") {
                value = text.toUpperCase();
            }

            await updateStore(data => {
                const item = data[collection].find(
                    x => x.id === id
                );

                if (item) {
                    item[field] = value;
                }
            });

            clearSession(chatId);

            await sendSaved(chatId);
            await startEdit(chatId, collection, id);
        }

    } catch (error) {
        console.error(error);

        await bot.sendMessage(
            chatId,
            "❌ لم تتم العملية:\n" + error.message
        );
    }
});


/* ==========================================
   BOT EVENTS
========================================== */

bot.on("polling_error", error => {
    console.error("Polling error:", error.message);
});

bot.on("error", error => {
    console.error("Bot error:", error.message);
});

console.log("--------------------------------");
console.log(" FADI WALEED BOT STARTED");
console.log("--------------------------------");
console.log("Admin ID:", ADMIN_ID);
console.log("GitHub Repository:", `${GITHUB_OWNER}/${GITHUB_REPO}`);
console.log("Branch:", GITHUB_BRANCH);
console.log("--------------------------------");
