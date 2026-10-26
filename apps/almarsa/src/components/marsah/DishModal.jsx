import { translated, arabicDescriptions } from "../../data/marsahArabic";
import { useEffect } from "react";

function formatPrice(price, currency = "USD") {
  const numeric = Number(String(price ?? "").replace(/[^0-9.]/g, ""));
  if (Number.isNaN(numeric)) return price;
  if (currency === "LBP") return `LBP ${Math.round(numeric).toLocaleString("en-US")}`;
  return `$${numeric.toFixed(2)}`;
}

function dishDescription(dish, language) {
  if (language === "ar") return dish.descriptionAr || arabicDescriptions[dish.name] || dish.descriptionEn || dish.description || "";
  return dish.descriptionEn || dish.description || "";
}

function DishModal({ dish, dishes = [], onClose, onChangeDish, language = "en", onAdd }) {
  const index = dish ? dishes.findIndex((item) => item.name === dish.name) : -1;

  const move = (direction) => {
    if (!dishes.length || index < 0) return;
    onChangeDish?.(dishes[(index + direction + dishes.length) % dishes.length]);
  };

  useEffect(() => {
    if (!dish) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [dish, index]);

  if (!dish) return null;

  const description = dishDescription(dish, language);
  const formatted = formatPrice(dish.price, dish.currency);

  return (
    <div className="v7-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className="v7-dish-modal" role="dialog" aria-modal="true" aria-label={dish.name}>
        <button className="v7-modal-close" type="button" onClick={onClose} aria-label="Close">×</button>

        <div className="v7-modal-visual">
          <div className="v7-modal-blob" aria-hidden="true" />
          {dish.image ? <img src={dish.image} alt={dish.name} /> : <div className="v7-modal-no-image">AL MARSAH</div>}
          <span className="v7-modal-count">{String(index + 1).padStart(2, "0")} / {String(dishes.length).padStart(2, "0")}</span>
        </div>

        <div className="v7-modal-copy">
          <p className="v7-modal-kicker">AL MARSAH · MEDITERRANEAN KITCHEN</p>
          <h2>{translated(dish.name, language)}</h2>
          <strong>{formatted}</strong>
          {description && <p className="v7-modal-description">{description}</p>}
          <button className="marsah-add-card" type="button" onClick={() => onAdd?.(dish)}>{language === "ar" ? "+ أضف إلى السلة" : "+ Add to order"}</button>
          <div className="v7-modal-divider"><span /></div>
          <div className="v7-modal-actions">
            <button type="button" onClick={() => move(-1)}><i>←</i><span>Previous dish</span></button>
            <button type="button" onClick={() => move(1)}><span>Next dish</span><i>→</i></button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DishModal;
