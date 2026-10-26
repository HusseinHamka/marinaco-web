import { translated } from "../../data/marsahArabic";
import DishCard from "./DishCard";

function MenuSection({
  category,
  index = 0,
  onOpenDish,
  onAdd,
  language,
}) {
  return (
    <section
      id={category.id}
      className="menu-category-section aqua-category-section"
    >
      <header className="aqua-category-header">
        <div>
          <span className="aqua-category-index">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h2>{translated(category.name, language)}</h2>
        </div>
      </header>

      <div className="dishes-grid aqua-dishes-grid">
        {category.dishes.map((dish, dishIndex) => (
          <DishCard
            key={`${category.id}-${dish.name}`}
            dish={dish}
            index={dishIndex}
            onOpenDish={onOpenDish}
            onAdd={onAdd}
            language={language}
          />
        ))}
      </div>
    </section>
  );
}

export default MenuSection;
