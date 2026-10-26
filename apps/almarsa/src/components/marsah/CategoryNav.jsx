import { translated } from "../../data/marsahArabic";
import { useEffect, useRef } from "react";
export default function CategoryNav({categories,activeCategory,language="en",onSelect}) {
  const scroller = useRef(null);
  useEffect(() => {scroller.current?.querySelector(".is-active")?.scrollIntoView({block:"nearest",inline:"nearest",behavior:"smooth"});},[activeCategory]);
  return <nav className="v7-category-nav marsah-tabs" aria-label="Menu categories"><div ref={scroller} className="v7-category-scroll">
    {categories.map(category => <button key={category.id} type="button" className={`v7-category-chip ${activeCategory === category.id ? "is-active" : ""}`} onClick={() => {onSelect?.(category.id); document.getElementById("our-menu")?.scrollIntoView({behavior:"smooth"});}}>{translated(category.name,language)}</button>)}
  </div></nav>;
}
