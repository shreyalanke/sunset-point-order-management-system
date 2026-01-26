import e from "express";
import { getAllIngredients, updateIngredientStock, addIngredient, getIngredientDetails, updateIngredientDetails } from "../controllers/inventory.controller.js";

let inventoryRoute = e.Router();
inventoryRoute.get("/ingredients", getAllIngredients);
inventoryRoute.get("/ingredients/:id", getIngredientDetails);
inventoryRoute.put("/ingredients/:id", updateIngredientStock);
inventoryRoute.patch("/ingredients/:id", updateIngredientDetails);
inventoryRoute.post("/ingredients", addIngredient);

export default inventoryRoute;