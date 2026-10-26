import { translated } from "../data/marsahArabic";
import { useEffect, useState } from "react";

import marsahLogo from "../assets/logos/marsah-logo.png";
import initialMenuData from "../data/marsahMenuData";

import TopNav from "../components/marsah/TopNav";
import CategoryNav from "../components/marsah/CategoryNav";
import MenuSection from "../components/marsah/MenuSection";
import DishModal from "../components/marsah/DishModal";
import AboutSection from "../components/marsah/AboutSection";
import FeedbackSection from "../components/marsah/FeedbackSection";

import "../styles/marsah-menu.css";
import "../styles/marsah-about.css";
import "../styles/marsah-feedback.css";
import { apiUrl, publicUrl } from "../publicPath.js";

function normalizeMenu(categories) {
  return categories.map((category) => ({
    ...category,
    cover: category.cover ? publicUrl(category.cover) : category.cover,
    dishes: category.dishes.map((dish) => ({
      ...dish,
      image: dish.image ? publicUrl(dish.image) : dish.image,
    })),
  }));
}

function MarsahMenu() {
  const [marsahMenuData, setMarsahMenuData] = useState(() => normalizeMenu(initialMenuData));
  useEffect(() => {
    fetch(apiUrl("/api/menu"))
      .then((response) => {
        if (!response.ok) throw new Error("Menu unavailable");
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setMarsahMenuData(normalizeMenu(data));
      })
      .catch(() => {});
  }, []);

  const [language, setLanguage] = useState("en");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activePage, setActivePage] = useState("menu");

  const addToCart = (dish) => setCart((previous) => {
    const found = previous.find((entry) => entry.name === dish.name);
    return found
      ? previous.map((entry) => entry.name === dish.name ? { ...entry, quantity: entry.quantity + 1 } : entry)
      : [...previous, { ...dish, quantity: 1 }];
  });

  const adjustCart = (name, delta) => setCart((previous) => previous
    .map((entry) => entry.name === name ? { ...entry, quantity: entry.quantity + delta } : entry)
    .filter((entry) => entry.quantity > 0));

  const formatPrice = (price, currency = "USD") => {
    const numericPrice = Number(String(price ?? "").replace(/[^0-9.]/g, ""));
    if (Number.isNaN(numericPrice)) return price;
    if (currency === "LBP") return `LBP ${Math.round(numericPrice).toLocaleString("en-US")}`;
    return `$${numericPrice.toFixed(2)}`;
  };

  const totalLabel = cart.length
    ? Object.entries(
        cart.reduce((groups, dish) => {
          const currency = dish.currency === "LBP" ? "LBP" : "USD";
          groups[currency] = (groups[currency] || 0) + Number(dish.price || 0) * dish.quantity;
          return groups;
        }, {}),
      )
        .map(([currency, amount]) => formatPrice(amount, currency))
        .join(" + ")
    : formatPrice(0, "USD");

  const allDishes = marsahMenuData.flatMap((category) => category.dishes);

  const heroDishes = [
    allDishes.find((dish) => dish.name === "Al Marsa Combo"),
    allDishes.find((dish) => dish.name === "Crab Avocado Salad"),
    allDishes.find((dish) => dish.name === "Shrimps Provencal"),
  ].filter(Boolean);

  const [activeCategory, setActiveCategory] = useState(marsahMenuData[0]?.id || "");
  const [selectedDish, setSelectedDish] = useState(null);

  useEffect(() => {
    if (!marsahMenuData.some((category) => category.id === activeCategory)) {
      setActiveCategory(marsahMenuData[0]?.id || "");
    }
  }, [marsahMenuData, activeCategory]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activePage]);

  return (
    <>
      <main className="marsah-menu" dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="marsah-order-controls">
          <TopNav language={language} activePage={activePage} onNavigate={setActivePage} />
          <div className="marsah-language-switch" role="group" aria-label="Select language">
            <button type="button" className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
            <button type="button" className={language === "ar" ? "selected" : ""} onClick={() => setLanguage("ar")} aria-pressed={language === "ar"}>عربي</button>
          </div>
          <button className="marsah-order-button" type="button" onClick={() => setCartOpen(true)}><svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg><span className="marsah-cart-count">{cart.reduce((sum, entry) => sum + entry.quantity, 0)}</span></button>
        </div>

        {/* ================================================
            MAIN NAVIGATION
            ================================================ */}

        {activePage === "menu" && (<>


        {/* ================================================
            HERO
            ================================================ */}

        <header className="marsah-menu-hero aqua-hero">
          <div className="aqua-hero-content">
            <div className="aqua-hero-copy">
              <img
                src={marsahLogo}
                alt="Al Marsah Restaurant"
                className="aqua-hero-logo"
              />

              <p className="aqua-hero-kicker">
                {language === "ar" ? "من قلب البحر المتوسط" : "FRESH FROM THE MEDITERRANEAN"}
              </p>

              <h1>
                {language === "ar" ? "اختار نكهتك" : "Pick your"}
                <span>{language === "ar" ? "البحرية." : "sea mood."}</span>
              </h1>

              <p className="aqua-hero-description">
                {language === "ar" ? "أشهى الأطباق اللبنانية وثمار البحر الطازجة، وأطباق شهية للمشاركة." : "Lebanese favorites, fresh seafood and generous plates made for sharing."}
              </p>

              <button
                type="button"
                className="aqua-hero-button"
                onClick={() => {
                  document
                    .getElementById("our-menu")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {language === "ar" ? "تصفّح المنيو" : "SEE THE MENU"}
                <span aria-hidden="true">↓</span>
              </button>
            </div>

            <div className="aqua-hero-plates">
              {heroDishes.map((dish, index) => (
                <button
                  key={dish.name}
                  type="button"
                  className={`aqua-plate aqua-plate-${index + 1}`}
                  onClick={() => setSelectedDish(dish)}
                  aria-label={`View ${dish.name}`}
                >
                  <span className="aqua-plate-ring">
                    <img src={dish.image} alt={dish.name} />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="aqua-hero-wave" aria-hidden="true">
            <span className="aqua-wave-back" />
            <span className="aqua-wave-mid" />
            <span className="aqua-wave-front" />
          </div>
        </header>


        {/* ================================================
            SEA TRANSITION
            ================================================ */}

        <div
          className="menu-sea-transition"
          aria-hidden="true"
        >
          <div className="sea-transition-layer sea-transition-back" />

          <div className="sea-transition-layer sea-transition-middle" />

          <div className="sea-transition-layer sea-transition-front" />
        </div>


        {/* ================================================
            MENU INTRO
            ================================================ */}

        <section
          className="menu-introduction aqua-menu-intro"
          id="our-menu"
        >
          <div className="aqua-intro-copy">
            <p>{language === "ar" ? "المنيو" : "OUR MENU"}</p>
            <h2>{language === "ar" ? "شو عبالك تاكل؟" : "What are you craving?"}</h2>
          </div>

          <div className="aqua-intro-note">
            <span>{language === "ar" ? "اكبس على الطبق لتشوف تفاصيله" : "Tap a dish for a closer look"}</span>
          </div>
        </section>


        {/* ================================================
            CATEGORY NAV
            ================================================ */}

        <CategoryNav
          categories={marsahMenuData.filter(
            (category) =>
              category.dishes.length >
              0,
          )}
          activeCategory={
            activeCategory
          }
          language={language}
          onSelect={setActiveCategory}
        />


        {/* ================================================
            MENU
            ================================================ */}

        <div className="menu-content">
          <div className="menu-content-glow menu-glow-one" />

          <div className="menu-content-glow menu-glow-two" />

          <div className="menu-sections">
            {marsahMenuData
              .filter((category) => category.dishes.length > 0 && category.id === activeCategory)
              .map((category, index) => (
                <MenuSection key={category.id} category={category} index={index}
                  onOpenDish={setSelectedDish} language={language} onAdd={addToCart} />
              ))}
          </div>
        </div>


        {/* ================================================
            ABOUT
            ================================================ */}

        </>)}
        {activePage === "about" && <div className="marsah-page-content"><AboutSection language={language} /></div>}


        {/* ================================================
            FEEDBACK
            ================================================ */}

        {activePage === "feedback" && <div className="marsah-page-content"><FeedbackSection language={language} /></div>}


        {/* ================================================
            FOOTER
            ================================================ */}

        <footer className="marsah-menu-footer aqua-footer">
          <div className="aqua-footer-wave" aria-hidden="true" />

          <div className="aqua-footer-inner">
            <img
              src={marsahLogo}
              alt="Al Marsah Restaurant"
              className="aqua-footer-logo"
            />

            <div className="aqua-footer-copy">
              <p>AL MARSAH RESTAURANT</p>
              <h2>One more plate?</h2>
              <span>Lebanese · Seafood · Grills</span>
            </div>
          </div>
          <div className="aqua-footer-bottom">
            <nav className="aqua-footer-links" aria-label="Footer navigation">
              <button type="button" onClick={() => { setActivePage("menu"); window.scrollTo({top:0,behavior:"smooth"}); }}>{language === "ar" ? "الرئيسية" : "Home"}</button>
              <button type="button" onClick={() => { setActivePage("about"); window.scrollTo({top:0,behavior:"smooth"}); }}>{language === "ar" ? "قصتنا" : "Our Story"}</button>
              <button type="button" onClick={() => { setActivePage("feedback"); window.scrollTo({top:0,behavior:"smooth"}); }}>{language === "ar" ? "آراؤكم" : "Feedbacks"}</button>
              <button type="button" onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>{language === "ar" ? "العودة للأعلى ↑" : "Back to Top ↑"}</button>
            </nav>
            <p className="aqua-footer-location" dir="ltr"><span aria-hidden="true">⌖</span> Seaside, Tyre</p>
          </div>
        </footer>
      </main>


      {/* ================================================
          DISH MODAL
          ================================================ */}

      {cartOpen && <div className="marsah-cart-overlay" onMouseDown={e => {if (e.target === e.currentTarget) setCartOpen(false)}}><section className="marsah-cart" role="dialog" aria-modal="true" dir={language === "ar" ? "rtl" : "ltr"}><header><h2>{language === "ar" ? "سلّة الطلبات" : "Your Order"}</h2><button type="button" onClick={() => setCartOpen(false)}>✕</button></header>{cart.length ? cart.map(d => <div className="marsah-cart-line" key={d.name}><div><b>{translated(d.name, language)}</b><small>{formatPrice(d.price, d.currency)}</small></div><div className="marsah-qty"><button onClick={() => adjustCart(d.name,-1)}>−</button><b>{d.quantity}</b><button onClick={() => adjustCart(d.name,1)}>+</button></div></div>) : <p>{language === "ar" ? "السلة فارغة" : "Your order is empty"}</p>}<footer><strong>{language === "ar" ? "المجموع" : "Total"}: {totalLabel}</strong><p>{language === "ar" ? "فرجي طلبك للنادل مباشرة" : "Show this order to your waiter"}</p><button onClick={() => window.print()}>{language === "ar" ? "طباعة الطلب" : "Print order"}</button></footer></section></div>}
      <DishModal
        dish={selectedDish}
        dishes={allDishes}
        onChangeDish={
          setSelectedDish
        }
        onClose={() =>
          setSelectedDish(null)
        }
        language={language}
        onAdd={addToCart}
      />
    </>
  );
}

export default MarsahMenu;
