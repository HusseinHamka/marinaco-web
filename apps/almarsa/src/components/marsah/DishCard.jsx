import { translated, arabicDescriptions } from "../../data/marsahArabic";

function formatPrice(price, currency = "USD") {
  if (price === null || price === undefined || price === "") return "";
  const numericPrice = Number(String(price).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(numericPrice)) return price;
  if (currency === "LBP") return `LBP ${Math.round(numericPrice).toLocaleString("en-US")}`;
  return `$${numericPrice.toFixed(2)}`;
}

function dishDescription(dish, language) {
  if (language === "ar") return dish.descriptionAr || arabicDescriptions[dish.name] || dish.descriptionEn || dish.description || "";
  return dish.descriptionEn || dish.description || "";
}

function DishCard({
  dish,
  onOpenDish,
  index = 0,
  language = "en",
  onAdd,
}) {
  const hasImage = typeof dish.image === "string" && dish.image.trim() !== "";
  const description = dishDescription(dish, language);

  return (
    <article
      className="dish-card aqua-dish-card"
      style={{
        "--dish-delay": `${Math.min(index * 45, 270)}ms`,
      }}
    >
      <button
        type="button"
        className="aqua-dish-button"
        onClick={() => onOpenDish?.(dish)}
        aria-label={`View ${dish.name}`}
      >
        <div className="aqua-dish-photo-wrap">
          <div className="aqua-dish-photo">
            {hasImage ? (
              <img src={dish.image} alt={dish.name} loading="lazy" />
            ) : (
              <span className="aqua-photo-placeholder">AL MARSAH</span>
            )}
          </div>
        </div>

        <div className="aqua-dish-body">
          <div className="aqua-dish-title-row">
            <h3>{translated(dish.name, language)}</h3>
            <strong>{formatPrice(dish.price, dish.currency)}</strong>
          </div>

          {description && <p>{description}</p>}

          <span className="aqua-dish-more">
            {language === "ar" ? "عرض الطبق" : "View dish"}
            <i aria-hidden="true">↗</i>
          </span>
        </div>
      </button>
      <button className="marsah-add-card" type="button" onClick={() => onAdd?.(dish)}>{language === "ar" ? "+ أضف إلى السلة" : "+ Add to order"}</button>
    </article>
  );
}

export default DishCard;
