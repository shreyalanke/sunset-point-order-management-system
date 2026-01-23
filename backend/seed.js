import pool from "./src/db.js";

let dishes = [
  // Hot Beverages
  { dish_name: "Tea", category: "Hot Beverage", price: 20 },
  { dish_name: "Green Tea", category: "Hot Beverage", price: 30 },
  { dish_name: "Black Tea", category: "Hot Beverage", price: 20 },
  { dish_name: "Hot Coffee", category: "Hot Beverage", price: 30 },
  { dish_name: "Black Coffee", category: "Hot Beverage", price: 25 },
  { dish_name: "Plain Hot Chocolate", category: "Hot Beverage", price: 40 },

  // Cold Coffee
  { dish_name: "Cold Coffee", category: "Cold Coffee", price: 50 },
  { dish_name: "Cold Coffee with Crush", category: "Cold Coffee", price: 70 },

  // Refreshers
  { dish_name: "Lemon Ice Tea", category: "Refresher", price: 50 },
  { dish_name: "Peach Ice Tea", category: "Refresher", price: 50 },
  { dish_name: "Mint Mojito", category: "Refresher", price: 80 },
  { dish_name: "Green Apple Mojito", category: "Refresher", price: 80 },

  // Smoothies
  { dish_name: "Blue Berry Smoothie", category: "Smoothie", price: 110 },
  { dish_name: "Strawberry Smoothie", category: "Smoothie", price: 110 },
  { dish_name: "Mango Smoothie", category: "Smoothie", price: 110 },
  { dish_name: "Oreo Smoothie", category: "Smoothie", price: 120 },
  { dish_name: "Dark Chocolate Smoothie", category: "Smoothie", price: 130 },

  // Shakes
  { dish_name: "Kit Kat Shake", category: "Shake", price: 110 },
  { dish_name: "Java Choco Chip Shake", category: "Shake", price: 120 },
  { dish_name: "Brownie Shake", category: "Shake", price: 130 },
  { dish_name: "Nutella Shake", category: "Shake", price: 140 },
  { dish_name: "Oreo Shake", category: "Shake", price: 100 },
  { dish_name: "Butter Scotch Shake", category: "Shake", price: 100 },
  { dish_name: "Rose Shake", category: "Shake", price: 90 },

  // Sandwich
  { dish_name: "Green Chatni Sandwich", category: "Sandwich", price: 60 },
  { dish_name: "Triple Cheese Sandwich", category: "Sandwich", price: 80 },
  { dish_name: "Chocolate Sandwich", category: "Sandwich", price: 80 },
  { dish_name: "Bombay Masala Sandwich", category: "Sandwich", price: 80 },
  { dish_name: "Classic Club Sandwich", category: "Sandwich", price: 100 },
  { dish_name: "Paneer Sandwich", category: "Sandwich", price: 120 },
  { dish_name: "Mexican Sandwich", category: "Sandwich", price: 130 },
  { dish_name: "Cheese Corn Sandwich", category: "Sandwich", price: 110 },
  { dish_name: "Extra Spicy Sandwich", category: "Sandwich", price: 120 },

  // Maggi
  { dish_name: "Plain Maggi", category: "Maggi", price: 50 },
  { dish_name: "Masala Maggi", category: "Maggi", price: 60 },
  { dish_name: "Cheese Masala Maggi", category: "Maggi", price: 70 },
  { dish_name: "Italian Maggi", category: "Maggi", price: 90 },
  { dish_name: "Peri Peri Cheese Maggi", category: "Maggi", price: 80 },
  { dish_name: "Cheese Corn Maggi", category: "Maggi", price: 80 },

  // Pasta
  { dish_name: "Alfredo Pasta (White)", category: "Pasta", price: 160 },
  { dish_name: "Arrabiata Pasta (Red)", category: "Pasta", price: 160 },
  { dish_name: "Pink Pasta (Red + White)", category: "Pasta", price: 180 },
  { dish_name: "Indian Pasta (All Veggies)", category: "Pasta", price: 120 },

  // Fries
  { dish_name: "Salted Fries", category: "Fries", price: 60 },
  { dish_name: "Peri Peri Fries", category: "Fries", price: 80 },
  { dish_name: "Cheese Peri Peri Fries", category: "Fries", price: 100 },
  { dish_name: "Chipotle Fries", category: "Fries", price: 120 },
  { dish_name: "Cheese Corn Balls (6 pcs)", category: "Fries", price: 120 },

  // Pizza
  { dish_name: "Margarita Pizza", category: "Pizza", price: 100 },
  { dish_name: "Cheese Chilli Toast", category: "Pizza", price: 80 },
  { dish_name: "Cheese Burst Pizza", category: "Pizza", price: 100 },
  { dish_name: "Corn Cheese Pizza", category: "Pizza", price: 110 },
  { dish_name: "Mexican Cheese Pizza", category: "Pizza", price: 140 },
  { dish_name: "Tandoori Paneer Pizza", category: "Pizza", price: 150 },
  { dish_name: "Mix Veg Cheese Pizza", category: "Pizza", price: 160 },
  { dish_name: "Pasta Pizza", category: "Pizza", price: 180 },
  { dish_name: "Special Pizza", category: "Pizza", price: 200 },

  // Burger
  { dish_name: "Crispy Veg Burger", category: "Burger", price: 80 },
  { dish_name: "Crispy Veg Cheese Burger", category: "Burger", price: 100 },
  { dish_name: "Crispy Veg Schezwan Burger", category: "Burger", price: 100 },
  { dish_name: "Crispy Paneer Burger", category: "Burger", price: 120 },
  { dish_name: "Crispy Paneer Cheese Burger", category: "Burger", price: 130 },
  { dish_name: "Crispy Paneer Schezwan Burger", category: "Burger", price: 140 },
  { dish_name: "Crispy Paneer Chipotle Burger", category: "Burger", price: 150 },
  { dish_name: "Crispy Paneer + Veg Burger", category: "Burger", price: 200 },
  { dish_name: "Crispy Double Decker Burger", category: "Burger", price: 190 },

  // Momos
  { dish_name: "Veg Steam Momo", category: "Momo", price: 80 },
  { dish_name: "Paneer Steam Momo", category: "Momo", price: 90 },
  { dish_name: "Veg Fried Momo", category: "Momo", price: 90 },
  { dish_name: "Paneer Fried Momo", category: "Momo", price: 100 },
  { dish_name: "Veg Tandoori Momo", category: "Momo", price: 120 },
  { dish_name: "Paneer Tandoori Momo", category: "Momo", price: 130 },
  { dish_name: "Veg Mexican Momo", category: "Momo", price: 150 },
  { dish_name: "Paneer Mexican Momo", category: "Momo", price: 160 },
  { dish_name: "Veg + Paneer Steam Momo", category: "Momo", price: 100 },
  { dish_name: "Veg + Paneer Fried Momo", category: "Momo", price: 120 },

  // Extra
  { dish_name: "Cheese", category: "Extra", price: 30 },


  { dish_name: "Water Bottle", category: "Misc", price: 20 },
  { dish_name: "Cigarettes", category: "Misc", price: 25 }
];

let  seedDishes = async () => {
    for (let dish of dishes) {
        let { dish_name, category, price } = dish;
        let query = `INSERT INTO dishes (dish_name, category, price) VALUES ($1, $2, $3)`;
        await pool.query(query, [dish_name, category, price]);
    }   
    console.log("Seeding completed");
 
};

await seedDishes();

const ingredients = [
  { name: "Milk", unit: "ml", stock: 50000 },
  { name: "Sugar", unit: "grams", stock: 10000 },
  { name: "Tea Leaves", unit: "grams", stock: 3000 },
  { name: "Coffee Powder", unit: "grams", stock: 3000 },
  { name: "Chocolate Syrup", unit: "ml", stock: 5000 },
  { name: "Ice Cubes", unit: "pieces", stock: 2000 },

  { name: "Bread", unit: "slices", stock: 500 },
  { name: "Butter", unit: "grams", stock: 5000 },
  { name: "Cheese", unit: "grams", stock: 8000 },

  { name: "Maggi Noodles", unit: "grams", stock: 5000 },
  { name: "Pasta", unit: "grams", stock: 6000 },
  { name: "Pizza Base", unit: "pieces", stock: 200 },

  { name: "Vegetables", unit: "grams", stock: 10000 },
  { name: "Paneer", unit: "grams", stock: 7000 },

  { name: "Burger Bun", unit: "pieces", stock: 300 },
  { name: "Momo Wrapper", unit: "pieces", stock: 1000 },

  { name: "Oil", unit: "ml", stock: 10000 },
  { name: "Sauce", unit: "ml", stock: 5000 }
];

const seedIngredients = async () => {
  try {
    for (let ing of ingredients) {
      // insert ingredient
      const res = await pool.query(
        `INSERT INTO ingredients (ingredient_name, unit)
         VALUES ($1, $2)
         RETURNING ingredient_id`,
        [ing.name, ing.unit]
      );

      const ingredientId = res.rows[0].ingredient_id;

      // insert inventory
      await pool.query(
        `INSERT INTO inventory (ingredient_id, stock_quantity)
         VALUES ($1, $2)`,
        [ingredientId, ing.stock]
      );
    }

    console.log("✅ Ingredients & inventory seeded");
    
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

await seedIngredients();

const recipes = {
  TEA: [
    { ingredient: "Milk", qty: 100 },
    { ingredient: "Sugar", qty: 10 },
    { ingredient: "Tea Leaves", qty: 5 }
  ],

  COFFEE: [
    { ingredient: "Milk", qty: 120 },
    { ingredient: "Sugar", qty: 10 },
    { ingredient: "Coffee Powder", qty: 6 }
  ],

  COLD_COFFEE: [
    { ingredient: "Milk", qty: 150 },
    { ingredient: "Sugar", qty: 15 },
    { ingredient: "Coffee Powder", qty: 6 },
    { ingredient: "Ice Cubes", qty: 5 }
  ],

  SANDWICH: [
    { ingredient: "Bread", qty: 2 },
    { ingredient: "Butter", qty: 10 },
    { ingredient: "Cheese", qty: 20 }
  ],

  MAGGI: [
    { ingredient: "Maggi Noodles", qty: 70 },
    { ingredient: "Oil", qty: 5 },
    { ingredient: "Vegetables", qty: 30 }
  ],

  PIZZA: [
    { ingredient: "Pizza Base", qty: 1 },
    { ingredient: "Cheese", qty: 80 },
    { ingredient: "Sauce", qty: 30 }
  ],

  BURGER: [
    { ingredient: "Burger Bun", qty: 1 },
    { ingredient: "Cheese", qty: 30 },
    { ingredient: "Vegetables", qty: 40 }
  ],

  MOMO: [
    { ingredient: "Momo Wrapper", qty: 6 },
    { ingredient: "Paneer", qty: 50 },
    { ingredient: "Oil", qty: 10 }
  ]
};

const dishRecipeMap = {
  "Tea": "TEA",
  "Green Tea": "TEA",
  "Black Tea": "TEA",

  "Hot Coffee": "COFFEE",
  "Black Coffee": "COFFEE",

  "Cold Coffee": "COLD_COFFEE",
  "Cold Coffee with Crush": "COLD_COFFEE",

  "Green Chatni Sandwich": "SANDWICH",
  "Triple Cheese Sandwich": "SANDWICH",
  "Bombay Masala Sandwich": "SANDWICH",

  "Plain Maggi": "MAGGI",
  "Masala Maggi": "MAGGI",
  "Cheese Masala Maggi": "MAGGI",

  "Margarita Pizza": "PIZZA",
  "Corn Cheese Pizza": "PIZZA",
  "Special Pizza": "PIZZA",

  "Crispy Veg Burger": "BURGER",
  "Crispy Paneer Burger": "BURGER",

  "Veg Steam Momo": "MOMO",
  "Paneer Steam Momo": "MOMO"
};

const seedDishIngredients = async () => {
  try {
    // cache ingredient ids
    const ingRes = await pool.query(
      `SELECT ingredient_id, ingredient_name FROM ingredients`
    );

    const ingredientMap = {};
    ingRes.rows.forEach(r => {
      ingredientMap[r.ingredient_name] = r.ingredient_id;
    });

    // get dishes
    const dishRes = await pool.query(
      `SELECT dish_id, dish_name FROM dishes`
    );

    for (let dish of dishRes.rows) {
      const recipeKey = dishRecipeMap[dish.dish_name];
      if (!recipeKey) continue;

      const recipe = recipes[recipeKey];

      for (let item of recipe) {
        await pool.query(
          `INSERT INTO dish_ingredients
           (dish_id, ingredient_id, quantity_needed)
           VALUES ($1, $2, $3)`,
          [
            dish.dish_id,
            ingredientMap[item.ingredient],
            item.qty
          ]
        );
      }
    }

    console.log("✅ Dish ingredients seeded");
    
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

await seedDishIngredients();

process.exit(0);


