import { useEffect, useState } from "react";

export default function TopNav({ language = "en", activePage = "menu", onNavigate }) {
  const [open, setOpen] = useState(false);

  const options = [
    { id: "menu", en: "Menu", ar: "المنيو" },
    { id: "about", en: "Our Story", ar: "قصّتنا" },
    { id: "feedback", en: "Feedback", ar: "رأيك يهمنا" },
  ];

  const choose = (id) => {
    onNavigate?.(id);
    setOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`marsah-drawer-toggle ${open ? "is-open" : ""} ${language === "ar" ? "is-ar" : "is-en"}`}
        aria-expanded={open}
        aria-controls="marsah-side-drawer"
        aria-label={open ? (language === "ar" ? "إغلاق القائمة" : "Close navigation") : (language === "ar" ? "فتح القائمة" : "Open navigation")}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="marsah-toggle-icon" aria-hidden="true">
          {open ? "✕" : "☰"}
        </span>
      </button>

      <div
        className={`marsah-drawer-backdrop ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside
        id="marsah-side-drawer"
        className={`marsah-side-drawer ${open ? "is-open" : ""} ${language === "ar" ? "is-ar" : "is-en"}`}
        aria-hidden={!open}
      >
        <div className="marsah-side-drawer-header">
          <button
            type="button"
            className="marsah-drawer-close"
            onClick={() => setOpen(false)}
            aria-label={language === "ar" ? "إغلاق" : "Close"}
          >
            ✕
          </button>
        </div>

        <nav className="marsah-side-drawer-nav" aria-label="Primary navigation">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={activePage === option.id ? "active" : ""}
              onClick={() => choose(option.id)}
            >
              <span className="marsah-drawer-item-label">
                {language === "ar" ? option.ar : option.en}
              </span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
