
/* ==========================================
   FADI WALEED
   WEBSITE ENGINE — script.js
   Version 1.0
========================================== */

"use strict";

/* ==========================================
   DEFAULT CONFIGURATION
========================================== */

const DEFAULT_CONFIG = {
    siteName: "FADI WALEED",
    brandTitle: "⍣ 𝗙𝗔𝗗𝗜 ⍣ أّلَقيِّأّدٍهّـ ⍣",
    theme: "midnight",
    currency: "USD",
    currencySymbol: "$",
    telegram: "https://t.me/Fxxso",

    announcement: "أهلاً بك في متجر فادي وليد للخدمات الرقمية",

    hero: {
        badge: "✦ حلول رقمية باحترافية",
        title: "أهلاً بك في عالم FADI WALEED",
        description: "نوفر لك خدمات رقمية وحلول تقنية مميزة بجودة عالية واحترافية تليق بطموحاتك."
    },

    about: {
        title: "من أنا؟",
        description: "فادي وليد، أقدم خدمات وحلولاً رقمية باهتمام بالتفاصيل والجودة."
    },

    sections: {
        services: "خدماتنا المميزة",
        offers: "عروضنا الحصرية"
    },

    settings: {
        showServices: true,
        showOffers: true,
        showReviews: true,
        showFAQ: true,
        showAbout: true
    }
};


/* ==========================================
   APPLICATION STATE
========================================== */

let config = { ...DEFAULT_CONFIG };

let services = [];
let offers = [];
let reviews = [];
let faqs = [];

let cart = [];

let activeCoupon = null;
let coupons = [];

let isLoading = true;


/* ==========================================
   HELPERS
========================================== */

const $ = (selector) => document.querySelector(selector);

const createElement = (tag, className, text) => {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = String(text);
    }

    return element;
};

function setText(selector, value) {
    const element = $(selector);

    if (element && value !== undefined && value !== null) {
        element.textContent = String(value);
    }
}

function showToast(message) {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

function formatPrice(price) {
    const number = Number(price);

    if (!Number.isFinite(number)) return "السعر عند الطلب";

    return `${number.toFixed(2)} ${config.currencySymbol || "$"}`;
}

function safeUrl(value) {
    try {
        const url = new URL(value, location.href);

        if (["http:", "https:"].includes(url.protocol)) {
            return url.href;
        }
    } catch (_) {}

    return "";
}

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}


/* ==========================================
   LOAD STORE DATA
========================================== */

async function loadStore() {
    try {
        const response = await fetch("./data.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Unable to load data.json");
        }

        const data = await response.json();

        config = {
            ...DEFAULT_CONFIG,
            ...(data.config || {})
        };

        config.hero = {
            ...DEFAULT_CONFIG.hero,
            ...(data.config?.hero || {})
        };

        config.about = {
            ...DEFAULT_CONFIG.about,
            ...(data.config?.about || {})
        };

        config.sections = {
            ...DEFAULT_CONFIG.sections,
            ...(data.config?.sections || {})
        };

        config.settings = {
            ...DEFAULT_CONFIG.settings,
            ...(data.config?.settings || {})
        };

        services = normalizeArray(data.services);
        offers = normalizeArray(data.offers);
        reviews = normalizeArray(data.reviews);
        faqs = normalizeArray(data.faqs);
        coupons = normalizeArray(data.coupons);

    } catch (error) {
        console.error("Store loading error:", error);

        showToast("تعذر تحميل بيانات المتجر. يتم استخدام البيانات الافتراضية.");

        config = { ...DEFAULT_CONFIG };
    }

    applyConfiguration();
    renderAll();

    isLoading = false;
    hideLoader();
}


/* ==========================================
   APPLY WEBSITE CONFIGURATION
========================================== */

function applyConfiguration() {
    document.title = config.siteName || DEFAULT_CONFIG.siteName;

    setText("#siteName", config.siteName);
    setText("#brandTitle", config.brandTitle);

    setText("#announcementText", config.announcement);

    setText("#heroBadge", config.hero.badge);
    setText("#heroTitle", config.hero.title);
    setText("#heroDescription", config.hero.description);

    setText("#aboutTitle", config.about.title);
    setText("#aboutDescription", config.about.description);

    setText("#servicesTitle", config.sections.services);
    setText("#offersTitle", config.sections.offers);

    setText("#currentYear", new Date().getFullYear());

    document.documentElement.dataset.theme =
        config.theme || "midnight";

    const telegram = safeUrl(config.telegram);

    if (telegram) {
        const contact = $("#telegramContact");

        if (contact) {
            contact.href = telegram;
        }

        document.querySelectorAll(".hero-social a, .footer a")
            .forEach(link => {
                link.href = telegram;
            });
    }

    applySectionVisibility();
}


/* ==========================================
   SECTION VISIBILITY
========================================== */

function applySectionVisibility() {
    const map = {
        services: "#services",
        offers: "#offers",
        reviews: "#reviews",
        faq: "#faq",
        about: "#about"
    };

    Object.entries(map).forEach(([key, selector]) => {
        const element = $(selector);

        if (!element) return;

        element.hidden = config.settings[`show${key[0].toUpperCase()}${key.slice(1)}`] === false;
    });
}


/* ==========================================
   THEME SYSTEM
========================================== */

const AVAILABLE_THEMES = [
    "midnight",
    "gold",
    "royal",
    "ocean",
    "emerald",
    "ruby",
    "sapphire",
    "cyber",
    "neon",
    "crimson",
    "silver",
    "ice",
    "sunset",
    "amethyst",
    "copper",
    "forest",
    "pink",
    "arctic",
    "obsidian",
    "royalblue",
    "lavender",
    "diamond",
    "orange",
    "matrix"
];

function setTheme(theme) {
    if (!AVAILABLE_THEMES.includes(theme)) {
        showToast("الثيم غير متاح");
        return;
    }

    document.documentElement.dataset.theme = theme;

    config.theme = theme;

    showToast("تم تغيير الثيم بنجاح");

    window.dispatchEvent(
        new CustomEvent("themeChanged", {
            detail: { theme }
        })
    );
}


/* ==========================================
   SERVICE CARD
========================================== */

function createServiceCard(service) {
    const card = createElement("article", "service-card");

    const icon = createElement(
        "div",
        "card-icon",
        service.icon || "✦"
    );

    const category = createElement(
        "div",
        "card-category",
        service.category || "خدمة رقمية"
    );

    const title = createElement(
        "h3",
        "",
        service.name || "خدمة بدون اسم"
    );

    const description = createElement(
        "p",
        "",
        service.description || "لا يوجد وصف متاح."
    );

    const footer = createElement("div", "card-footer");

    const price = createElement(
        "span",
        "card-price",
        service.price === null || service.price === undefined
            ? "السعر عند الطلب"
            : formatPrice(service.price)
    );

    const button = createElement(
        "button",
        "card-order",
        "أضف للسلة +"
    );

    button.type = "button";

    button.addEventListener("click", () => {
        addToCart(service.id);
    });

    footer.append(price, button);

    card.append(
        icon,
        category,
        title,
        description,
        footer
    );

    if (service.badge) {
        const badge = createElement(
            "span",
            "card-category",
            service.badge
        );

        card.insertBefore(badge, icon);
    }

    return card;
}


/* ==========================================
   RENDER SERVICES
========================================== */

function renderServices() {
    const container = $("#servicesGrid");

    if (!container) return;

    container.replaceChildren();

    const search = ($("#serviceSearch")?.value || "")
        .trim()
        .toLowerCase();

    const category = $("#serviceCategory")?.value || "all";

    const filtered = services.filter(service => {
        const matchesSearch = [
            service.name,
            service.description,
            service.category
        ].join(" ").toLowerCase().includes(search);

        const matchesCategory =
            category === "all" || service.category === category;

        return service.active !== false &&
            matchesSearch &&
            matchesCategory;
    });

    if (!filtered.length) {
        container.append(
            createElement("p", "empty-state", "لا توجد خدمات مطابقة لبحثك.")
        );

        return;
    }

    filtered.forEach(service => {
        container.append(createServiceCard(service));
    });
}


/* ==========================================
   CATEGORY FILTER
========================================== */

function renderCategories() {
    const select = $("#serviceCategory");

    if (!select) return;

    const previous = select.value || "all";

    const categories = [
        ...new Set(
            services
                .filter(service => service.active !== false)
                .map(service => service.category)
                .filter(Boolean)
        )
    ];

    select.replaceChildren();

    const allOption = createElement(
        "option",
        "",
        "كل التصنيفات"
    );

    allOption.value = "all";
    select.append(allOption);

    categories.forEach(category => {
        const option = createElement("option", "", category);
        option.value = category;
        select.append(option);
    });

    select.value = categories.includes(previous) ? previous : "all";
}


/* ==========================================
   OFFERS
========================================== */

function renderOffers() {
    const container = $("#offersGrid");

    if (!container) return;

    container.replaceChildren();

    const activeOffers = offers.filter(offer => {
        if (offer.active === false) return false;

        if (offer.endDate) {
            return new Date(offer.endDate).getTime() > Date.now();
        }

        return true;
    });

    if (!activeOffers.length) {
        container.append(
            createElement("p", "empty-state", "لا توجد عروض متاحة حالياً.")
        );

        return;
    }

    activeOffers.forEach(offer => {
        const card = createServiceCard({
            ...offer,
            badge: offer.badge || "عرض خاص"
        });

        container.append(card);
    });
}


/* ==========================================
   REVIEWS
========================================== */

function renderReviews() {
    const container = $("#reviewsGrid");

    if (!container) return;

    container.replaceChildren();

    reviews
        .filter(review => review.active !== false)
        .forEach(review => {
            const card = createElement("article", "review-card");

            const stars = createElement(
                "div",
                "review-stars",
                "★".repeat(
                    Math.max(0, Math.min(5, Number(review.rating) || 5))
                )
            );

            const content = createElement(
                "p",
                "",
                review.text || ""
            );

            const name = createElement(
                "strong",
                "",
                review.name || "عميل"
            );

            card.append(stars, content, name);
            container.append(card);
        });
}


/* ==========================================
   FAQ
========================================== */

function renderFAQ() {
    const container = $("#faqContainer");

    if (!container) return;

    container.replaceChildren();

    faqs
        .filter(faq => faq.active !== false)
        .forEach(faq => {
            const item = createElement("details", "faq-item");

            const question = createElement(
                "summary",
                "",
                faq.question || "سؤال"
            );

            const answer = createElement(
                "p",
                "",
                faq.answer || ""
            );

            item.append(question, answer);
            container.append(item);
        });
}


/* ==========================================
   CART SYSTEM
========================================== */

function addToCart(id) {
    const service = services.find(item => item.id === id) ||
        offers.find(item => item.id === id);

    if (!service) {
        showToast("الخدمة غير موجودة");
        return;
    }

    if (service.price === null || service.price === undefined) {
        showToast("تواصل معنا لمعرفة سعر الخدمة");
        return;
    }

    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id: service.id,
            name: service.name,
            price: Number(service.price),
            quantity: 1
        });
    }

    renderCart();

    showToast("تمت إضافة الخدمة إلى السلة");
}


function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);

    renderCart();
}


function changeQuantity(id, amount) {
    const item = cart.find(item => item.id === id);

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        removeFromCart(id);
        return;
    }

    renderCart();
}


function getCartSubtotal() {
    return cart.reduce((sum, item) => {
        return sum + item.price * item.quantity;
    }, 0);
}


function getDiscount() {
    if (!activeCoupon) return 0;

    const subtotal = getCartSubtotal();

    if (subtotal < Number(activeCoupon.minimum || 0)) {
        return 0;
    }

    if (activeCoupon.type === "fixed") {
        return Math.min(
            subtotal,
            Number(activeCoupon.value || 0)
        );
    }

    return subtotal * (
        Math.min(100, Number(activeCoupon.value || 0)) / 100
    );
}


function getCartTotal() {
    return Math.max(0, getCartSubtotal() - getDiscount());
}


/* ==========================================
   RENDER CART
========================================== */

function renderCart() {
    const container = $("#cartItems");

    if (!container) return;

    container.replaceChildren();

    setText("#cartCount", cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    ));

    if (!cart.length) {
        container.append(
            createElement("p", "empty-state", "سلة المشتريات فارغة.")
        );
    }

    cart.forEach(item => {
        const row = createElement("div", "cart-row");

        const info = createElement("div", "cart-row-info");

        info.append(
            createElement("strong", "", item.name),
            createElement("small", "", formatPrice(item.price))
        );

        const controls = createElement("div", "cart-controls");

        const minus = createElement("button", "", "−");
        const count = createElement("span", "", item.quantity);
        const plus = createElement("button", "", "+");
        const remove = createElement("button", "", "×");

        minus.addEventListener("click", () => {
            changeQuantity(item.id, -1);
        });

        plus.addEventListener("click", () => {
            changeQuantity(item.id, 1);
        });

        remove.addEventListener("click", () => {
            removeFromCart(item.id);
        });

        controls.append(minus, count, plus, remove);

        row.append(info, controls);

        container.append(row);
    });

    setText("#cartTotal", formatPrice(getCartTotal()));
}


/* ==========================================
   COUPONS
========================================== */

function applyCoupon() {
    const input = $("#couponInput");

    const code = (input?.value || "")
        .trim()
        .toUpperCase();

    if (!code) {
        showToast("اكتب كود الخصم أولاً");
        return;
    }

    const coupon = coupons.find(item => {
        return item.code?.toUpperCase() === code &&
            item.active !== false;
    });

    if (!coupon) {
        showToast("الكوبون غير صحيح أو غير متاح");
        return;
    }

    if (coupon.expiresAt &&
        new Date(coupon.expiresAt).getTime() <= Date.now()) {
        showToast("انتهت صلاحية الكوبون");
        return;
    }

    activeCoupon = coupon;

    renderCart();

    showToast("تم تطبيق الكوبون");
}


/* ==========================================
   CHECKOUT
========================================== */

function buildOrderMessage() {
    const items = cart.map(item => {
        return `• ${item.name} × ${item.quantity} = ${formatPrice(item.price * item.quantity)}`;
    }).join("\n");

    return [
        "طلب جديد من متجر FADI WALEED",
        "",
        items,
        "",
        `الإجمالي قبل الخصم: ${formatPrice(getCartSubtotal())}`,
        `الخصم: ${formatPrice(getDiscount())}`,
        `الإجمالي: ${formatPrice(getCartTotal())}`,
        `الكوبون: ${activeCoupon?.code || "لا يوجد"}`
    ].join("\n");
}


async function checkout() {
    if (!cart.length) {
        showToast("السلة فارغة");
        return;
    }

    const order = {
        items: cart.map(item => ({ ...item })),
        subtotal: getCartSubtotal(),
        discount: getDiscount(),
        total: getCartTotal(),
        coupon: activeCoupon?.code || null,
        createdAt: new Date().toISOString()
    };

    /*
       Production order endpoint.
       Configure this from your store settings.
    */

    if (config.orderEndpoint) {
        try {
            const response = await fetch(config.orderEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(order)
            });

            if (!response.ok) {
                throw new Error("Order submission failed");
            }

            showToast("تم إرسال الطلب بنجاح");

            cart = [];
            activeCoupon = null;
            renderCart();

            return;

        } catch (error) {
            console.error(error);
            showToast("تعذر إرسال الطلب، حاول مرة أخرى");
            return;
        }
    }

    /*
       Temporary manual checkout.
       This opens Telegram with a prepared message.
       It does not store an order in a database.
    */

    const telegram = safeUrl(config.telegram);

    if (!telegram) {
        showToast("رابط التواصل غير صالح");
        return;
    }

    const message = encodeURIComponent(buildOrderMessage());

    window.open(
        `${telegram}?text=${message}`,
        "_blank",
        "noopener,noreferrer"
    );
}


/* ==========================================
   CART WINDOW
========================================== */

function openCart() {
    $("#cartOverlay")?.classList.add("active");
}

function closeCart() {
    $("#cartOverlay")?.classList.remove("active");
}


/* ==========================================
   NAVIGATION
========================================== */

function initializeNavigation() {
    const toggle = $("#menuToggle");
    const nav = $("#navigation");

    toggle?.addEventListener("click", () => {
        nav?.classList.toggle("open");
    });

    nav?.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            nav.classList.remove("open");
        });
    });
}


/* ==========================================
   EVENT LISTENERS
========================================== */

function initializeEvents() {
    $("#serviceSearch")?.addEventListener("input", renderServices);

    $("#serviceCategory")?.addEventListener("change", renderServices);

    $("#cartButton")?.addEventListener("click", openCart);

    $("#closeCart")?.addEventListener("click", closeCart);

    $("#cartOverlay")?.addEventListener("click", event => {
        if (event.target.id === "cartOverlay") {
            closeCart();
        }
    });

    $("#applyCoupon")?.addEventListener("click", applyCoupon);

    $("#checkoutButton")?.addEventListener("click", checkout);

    $("#themeButton")?.addEventListener("click", () => {
        const current = document.documentElement.dataset.theme || "midnight";

        const index = AVAILABLE_THEMES.indexOf(current);

        const next = AVAILABLE_THEMES[
            (index + 1) % AVAILABLE_THEMES.length
        ];

        setTheme(next);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeCart();
            $("#navigation")?.classList.remove("open");
        }
    });

    initializeNavigation();
}


/* ==========================================
   STATISTICS
========================================== */

function renderStatistics() {
    setText(
        "#statServices",
        services.filter(item => item.active !== false).length
    );

    setText(
        "#statOffers",
        offers.filter(item => item.active !== false).length
    );

    setText("#statOrders", "—");
}


/* ==========================================
   RENDER ALL
========================================== */

function renderAll() {
    renderCategories();
    renderServices();
    renderOffers();
    renderReviews();
    renderFAQ();
    renderStatistics();
    renderCart();
}


/* ==========================================
   LOADER
========================================== */

function hideLoader() {
    const loader = $("#loader");

    if (!loader) return;

    loader.classList.add("hidden");

    setTimeout(() => {
        loader.remove();
    }, 600);
}


/* ==========================================
   LIVE ADMIN CONFIG UPDATES
========================================== */

window.addEventListener("storeConfigUpdated", event => {
    const data = event.detail;

    if (!data || typeof data !== "object") return;

    config = {
        ...config,
        ...data
    };

    applyConfiguration();
    renderAll();
});


/* ==========================================
   INITIALIZATION
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    initializeEvents();
    loadStore();
});


/* ==========================================
   PUBLIC API
========================================== */

window.FadiStore = {
    setTheme,
    addToCart,
    removeFromCart,
    changeQuantity,
    openCart,
    closeCart,
    renderAll,

    getCart: () => cart.map(item => ({ ...item })),

    getThemes: () => [...AVAILABLE_THEMES],

    getTotal: getCartTotal,

    getConfig: () => ({ ...config })
};
