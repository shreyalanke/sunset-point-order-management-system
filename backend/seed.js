import pool from "./db.js";   

let dishes =  [
    {dish_name: "Spaghetti Bolognese", category: "Main Course", price: 12},
    {dish_name: "Caesar Salad", category: "Appetizer", price: 8},
    {dish_name: "Margherita Pizza", category: "Main Course", price: 10},
    {dish_name: "Tiramisu", category: "Dessert", price: 6},
    {dish_name: "Minestrone Soup", category: "Appetizer", price: 7}
];
let seedDishes = async () => {
    for (let dish of dishes) {
        let { dish_name, category, price } = dish;
        let query = `INSERT INTO dishes (dish_name, category, price) VALUES ($1, $2, $3)`;
        await pool.query(query, [dish_name, category, price]);
    }   
    console.log("Seeding completed");
    process.exit();
   
};

seedDishes();