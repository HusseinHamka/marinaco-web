/* =========================================================
   AL MARSAH MENU DATA
   ========================================================= */

/* =========================================================
   SOUP
   ========================================================= */
import seafoodSoup from "../assets/marsah/dishes/seafood-soup.webp";
import hotSourSoup from "../assets/marsah/dishes/hot-sour-soup-compressed.webp";

/* =========================================================
   SALADS
   ========================================================= */
import img_seafood_salad from "../assets/marsah/dishes/seafood-salad.webp";
import img_chicken_caesar_salad from "../assets/marsah/dishes/chicken-caesar-salad.webp";
import img_chicken_mango_salad from "../assets/marsah/dishes/chicken-mango-salad.webp";
import crabAvocadoSalad from "../assets/marsah/dishes/crab-avocado-salad.webp";
import gardenSalad from "../assets/marsah/dishes/garden-salad.webp";
import avocadoShrimpsSalad from "../assets/marsah/dishes/avocado-shrimps-salad.webp";
import roccaBetrootSalad from "../assets/marsah/dishes/rocca-betroot-salad.webp";
import tabouleh from "../assets/marsah/dishes/tabouleh.webp";
import fatoush from "../assets/marsah/dishes/fatoush.webp";
import exoticSalad from "../assets/marsah/dishes/exotic-salad-compressed.webp";

/* =========================================================
   COLD APPETIZERS
   ========================================================= */
import img_hummus_avocado_shrimps from "../assets/marsah/dishes/hummus-avocado-shrimps.webp";
import img_hummus from "../assets/marsah/dishes/hummus.webp";
import img_moutabbal from "../assets/marsah/dishes/moutabbal.webp";
import img_hummus_meat from "../assets/marsah/dishes/hummus-meat.webp";
import img_raw_fish from "../assets/marsah/dishes/raw-fish.webp";
import hummusAlMarsa from "../assets/marsah/dishes/hummus-al-marsa.webp";
import vineLeaves from "../assets/marsah/dishes/vine-leaves.webp";
import lebaneseFrakeh from "../assets/marsah/dishes/lebanese-frakeh.webp";
import img_shawarma_hummus from "../assets/marsah/dishes/shawarma-hummus.webp";

/* =========================================================
   HOT APPETIZERS
   ========================================================= */
import img_fish_beiruti from "../assets/marsah/dishes/fish-beiruti.webp";
import img_tajin_traboulseye from "../assets/marsah/dishes/tajin-traboulseye.webp";
import shrimpFatte from "../assets/marsah/dishes/shrimp-fatte.webp";
import fatteLahme from "../assets/marsah/dishes/fatte-lahme.webp";
import cheeseRolls from "../assets/marsah/dishes/cheese-rolls.webp";
import vegetableRoll from "../assets/marsah/dishes/vegetable-roll.webp";
import shrimpRolls from "../assets/marsah/dishes/shrimp-rolls.webp";
import friedKebbe from "../assets/marsah/dishes/fried-kebbe.webp";
import corianderPotato from "../assets/marsah/dishes/coriander-potato.webp";
import fries from "../assets/marsah/dishes/fries.webp";
import makanek from "../assets/marsah/dishes/makanek.webp";
import soujokWithVegetables from "../assets/marsah/dishes/soujok-with-vegetables.webp";
import rasAsfoor from "../assets/marsah/dishes/ras-asfoor.webp";
import octopusProvencal from "../assets/marsah/dishes/octopus-provencal.webp";
import friedSardineBizri from "../assets/marsah/dishes/fried-sardine-bizri.webp";
import shrimpsProvencal from "../assets/marsah/dishes/shrimps-provencal.webp";
import calamariProvencal from "../assets/marsah/dishes/calamari-provencal.webp";
import alMarsaCombo from "../assets/marsah/dishes/al-marsa-combo.webp";
import shrimpCreamBasil from "../assets/marsah/dishes/shrimp-with-cream-and-basil.webp";
import dynamiteShrimp from "../assets/marsah/dishes/dynamite-shrimp-compressed.webp";
import shrimpShop from "../assets/marsah/dishes/shrimp-shop-compressed.webp";

/* =========================================================
   GRILLS
   ========================================================= */
import tawouk from "../assets/marsah/dishes/tawouk.webp";
import grilledBeef from "../assets/marsah/dishes/grilled-beef.webp";
import grilledKafta from "../assets/marsah/dishes/grilled-kafta.webp";
import mixGrills from "../assets/marsah/dishes/mix-grills.webp";

/* =========================================================
   MAIN COURSE
   ========================================================= */
import img_paella from "../assets/marsah/dishes/paella.webp";
import img_roasted_potatoes_shrimp from "../assets/marsah/dishes/roasted-potatoes-shrimp.webp";
import img_chili_fish from "../assets/marsah/dishes/chili-fish.webp";
import lemonFish from "../assets/marsah/dishes/lemon-fish-compressed.webp";
import grilledSalmonFillet from "../assets/marsah/dishes/grilled-salmon-fillet-compressed.webp";
import shrimpCaribbean from "../assets/marsah/dishes/shrimp-caribbean-compressed.webp";

/* =========================================================
   FRUITS & CATCH OF THE DAY
   ========================================================= */
import img_seasonal_fruits from "../assets/marsah/dishes/seasonal-fruits.webp";
import img_lokkos_by_kg from "../assets/marsah/dishes/lokkos-by-kg.webp";
import img_sultan_ibrahim from "../assets/marsah/dishes/sultan-ibrahim.webp";
import img_grilled_shrimp_jamboo from "../assets/marsah/dishes/grilled-shrimp-jamboo.webp";
import img_ajaj from "../assets/marsah/dishes/ajaj.webp";
import img_mixed_white_fish from "../assets/marsah/dishes/mixed-white-fish.webp";

const marsahMenuData = [
  {
    id: "soup",
    name: "Soup",
    icon: "♨",
    subtitle: "Warm flavors from our kitchen",
    dishes: [
      {
        name: "Seafood Soup",
        price: 11.6,
        description:
          "Shrimp, Calamari, Crab, Fish fillet, Mushroom, bamboo, Dark soya",
        image: seafoodSoup,
      },
      {
        name: "Hot & Sour Soup",
        price: 9.3,
        description: "Mushroom, bamboo, soya sauce",
        image: hotSourSoup,
      },
    ],
  },

  {
    id: "salad",
    name: "Salad",
    icon: "❋",
    subtitle: "Fresh Mediterranean selections",
    dishes: [
      {
        name: "Seafood Salad",
        price: 19,
        description:
          "Shrimp, Carrot, Lettuce, Cucumber, Cabbage, Lemon juice, Sesame Oil, sesame, Crab, Calamar",
        image: img_seafood_salad,
      },
      {
        name: "Chicken Caesar Salad",
        price: 13.5,
        description:
          "Iceberg, cherry tomato, parmesan cheese, caesar dressing, chicken",
        image: img_chicken_caesar_salad,
      },
      {
        name: "Chicken Mango Salad",
        price: 21.5,
        description:
          "Mix green salad, cucumber, cherry tomato, mango, turkey baby corn, caramelized nuts, orange mayo sauce",
        image: img_chicken_mango_salad,
      },
      {
        name: "Exotic Salad",
        price: 17.9,
        description:
          "Baby rocca, mix green, mango, avocado, strawberry, kiwi, crab sticks, shrimps, fruity dressing",
        image: exoticSalad,
      },
      {
        name: "Crab Avocado Salad",
        price: 17,
        description: "",
        image: crabAvocadoSalad,
      },
      {
        name: "Garden Salad",
        price: 11,
        description: "",
        image: gardenSalad,
      },
      {
        name: "Avocado And Shrimps Salad",
        price: 14.6,
        description: "",
        image: avocadoShrimpsSalad,
      },
      {
        name: "Rocca With Beetroot Salad",
        price: 6.8,
        description: "",
        image: roccaBetrootSalad,
      },
      {
        name: "Tabouli",
        price: 6.8,
        description: "",
        image: tabouleh,
      },
      {
        name: "Fatoush",
        price: 6.8,
        description: "",
        image: fatoush,
      },
    ],
  },

  {
    id: "cold-appetizer",
    name: "Cold Appetizer",
    icon: "◇",
    subtitle: "Mediterranean classics to begin",
    dishes: [
      {
        name: "Hummus With Avoca And Shrimps",
        price: 12.2,
        description: "",
        image: img_hummus_avocado_shrimps,
      },
      {
        name: "Hummus",
        price: 5.6,
        description: "",
        image: img_hummus,
      },
      {
        name: "Moutabbal",
        price: 5.64,
        description: "",
        image: img_moutabbal,
      },
      {
        name: "Hummus With Meat",
        price: 12.2,
        description: "Hummus with tahini served with meat and nuts",
        image: img_hummus_meat,
      },
      {
        name: "Raw Fish",
        price: 24.1,
        description: "",
        image: img_raw_fish,
      },
      {
        name: "Hummus Almarsa",
        price: 12.2,
        description: "Traditional hummus with nuts, almonds and chili oil.",
        image: hummusAlMarsa,
      },
      {
        name: "Vine Leaves",
        price: 7.4,
        description: "",
        image: vineLeaves,
      },
      {
        name: "Lebanese Frakeh",
        price: 11,
        description: "",
        image: lebaneseFrakeh,
      },
      {
        name: "Shawarma Hummus",
        price: 12.2,
        description: "Shawarma meat, hummus",
        image: img_shawarma_hummus,
      },
    ],
  },

  {
    id: "hot-appetizer",
    name: "Hot Appetizer",
    icon: "♨",
    subtitle: "Hot plates made for sharing",
    dishes: [
      {
        name: "Fish Beiruti",
        price: 11,
        description:
          "Crispy fried fish fillet with spicy sauce, colorful bell peppers & onions, topped with nuts",
        image: img_fish_beiruti,
      },
      {
        name: "Tajin Traboulseye",
        price: 11,
        description: "Crispy fish fillet in tahini & onion sauce, topped with nuts",
        image: img_tajin_traboulseye,
      },
      {
        name: "Dynamite Shrimp",
        price: 15.2,
        description: "",
        image: dynamiteShrimp,
      },
      {
        name: "Shrimp Shop",
        price: 17,
        description: "Shrimp pane, soya spicy coriander sauce",
        image: shrimpShop,
      },
      {
        name: "Shrimp Fatte",
        price: 14,
        description: "",
        image: shrimpFatte,
      },
      {
        name: "Fatte Lahme",
        price: 13.5,
        description: "",
        image: fatteLahme,
      },
      {
        name: "Cheese Rolls",
        price: 7.7,
        description: "",
        image: cheeseRolls,
      },
      {
        name: "Vegetable Roll",
        price: 8.2,
        description: "",
        image: vegetableRoll,
      },
      {
        name: "Shrimp Rolls",
        price: 11.1,
        description: "",
        image: shrimpRolls,
      },
      {
        name: "Fried Kebbe",
        price: 11,
        description: "",
        image: friedKebbe,
      },
      {
        name: "Coriander Potato",
        price: 5.6,
        description: "",
        image: corianderPotato,
      },
      {
        name: "Fries",
        price: 6.2,
        description: "",
        image: fries,
      },
      {
        name: "Makanek",
        price: 9.4,
        description: "",
        image: makanek,
      },
      {
        name: "Soujuk With Vegetables",
        price: 11.1,
        description: "",
        image: soujokWithVegetables,
      },
      {
        name: "Ras Asfoor",
        price: 12.6,
        description: "",
        image: rasAsfoor,
      },
      {
        name: "Octopus Provencal",
        price: 14.5,
        description: "",
        image: octopusProvencal,
      },
      {
        name: "Fried Sardine Bizri",
        price: 9,
        description: "",
        image: friedSardineBizri,
      },
      {
        name: "Shrimps Provencal",
        price: 11,
        description: "",
        image: shrimpsProvencal,
      },
      {
        name: "Calamari Provencal",
        price: 11.2,
        description: "",
        image: calamariProvencal,
      },
      {
        name: "Al Marsa Combo",
        price: 35,
        description: "",
        image: alMarsaCombo,
      },
      {
        name: "Shrimp With Cream And Basil",
        price: 15.8,
        description: "",
        image: shrimpCreamBasil,
      },
    ],
  },

  {
    id: "grills",
    name: "Grills",
    icon: "♨",
    subtitle: "From the grill to your table",
    dishes: [
      {
        name: "Tawouk",
        price: 19,
        description: "",
        image: tawouk,
      },
      {
        name: "Grilled Beef",
        price: 27.6,
        description: "",
        image: grilledBeef,
      },
      {
        name: "Grilled Kafta",
        price: 18.2,
        description: "",
        image: grilledKafta,
      },
      {
        name: "Mix Grills",
        price: 27,
        description: "",
        image: mixGrills,
      },
    ],
  },

  {
    id: "main-course",
    name: "Main Course",
    subtitle: "Freshly prepared mains",
    dishes: [
      {
        name: "Paella",
        price: 42,
        description:
          "Spanish rice with prawns, calamari, fish and shellfish, peppers and onions",
        image: img_paella,
      },
      {
        name: "Roasted Potatoes with Shrimp",
        price: 24,
        description:
          "Oven-roasted potatoes with creamy sauce, shrimp and melted mozzarella",
        image: img_roasted_potatoes_shrimp,
      },
      {
        name: "Chili Fish",
        price: 33.3,
        description:
          "Grilled boneless seabream fillet with spicy tomato, pepper and onion sauce, roasted nuts and potatoes",
        image: img_chili_fish,
      },
      {
        name: "Lemon Fish",
        price: 29.7,
        description:
          "Grilled fish fillet, lemon butter sauce, served with sauteed baby potato and sauteed vegetables",
        image: lemonFish,
      },
      {
        name: "Grilled Salmon Fillet",
        price: 34.1,
        description:
          "Fillet salmon served with halyoun and vegetable rice, orange sauce",
        image: grilledSalmonFillet,
      },
      {
        name: "Shrimp Caribbean",
        price: 34.1,
        description:
          "Marinated shrimps, green onion, paella rice, spicy tomato sauce",
        image: shrimpCaribbean,
      },
    ],
  },

  {
    id: "fruits",
    name: "Fruits",
    subtitle: "Fresh seasonal fruits",
    dishes: [
      {
        name: "Seasonal Fruits",
        price: 30.3,
        description: "Watermelon, melon, mixed fruits",
        image: img_seasonal_fruits,
      },
    ],
  },

  {
    id: "catch-of-the-day",
    name: "Catch of the Day",
    subtitle: "From the sea",
    dishes: [
      {
        name: "Lokkos by kg",
        price: 72,
        description: "",
        image: img_lokkos_by_kg,
      },
      {
        name: "Sultan Ibrahim by kg",
        price: 72,
        description: "",
        image: img_sultan_ibrahim,
      },
      {
        name: "Mixed white fish by KG",
        price: 48,
        description: "",
        image: img_mixed_white_fish,
      },
      {
        name: "Ajaj by kg",
        price: 40,
        description: "",
        image: img_ajaj,
      },
      {
        name: "GRILLED SHRIMP JAMBOO",
        price: 84,
        description: "",
        image: img_grilled_shrimp_jamboo,
      },
    ],
  },
];

export default marsahMenuData;
