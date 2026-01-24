import e from "express";
import { getAllIngredients } from "../controllers/inventory.controller.js";

let inventoryRoute = e.Router();
inventoryRoute.get("/ingredients", getAllIngredients);

export default inventoryRoute;