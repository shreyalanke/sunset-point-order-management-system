import databaseService from "../services/database.service.js";

async function getAllIngredients(req,res) {
    try{
        let ingredients =  await databaseService.getAllIngredients();
        return res.status(200).json(ingredients);
    }catch(error){
        console.error("Error fetching ingredients:", error);
        return res.status(500).send({message: "Internal Server Error"})
    }
}

async function updateIngredientStock(req, res) {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        
        if (quantity === undefined || quantity === null) {
            return res.status(400).json({ message: "Quantity is required" });
        }
        
        if (quantity < 0) {
            return res.status(400).json({ message: "Quantity cannot be negative" });
        }
        
        await databaseService.updateIngredientStock(parseInt(id), parseFloat(quantity));
        return res.status(200).json({ message: "Stock updated successfully" });
    } catch (error) {
        console.error("Error updating ingredient stock:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
}

async function addIngredient(req, res) {
    try {
        const { name, unit, category, maxStock, initialStock } = req.body;
        
        if (!name || !unit || !maxStock) {
            return res.status(400).json({ message: "Name, unit, and maxStock are required" });
        }
        
        const result = await databaseService.addIngredient({
            name,
            unit,
            category: category || 'General',
            maxStock: parseFloat(maxStock),
            initialStock: initialStock !== undefined ? parseFloat(initialStock) : 0
        });
        
        return res.status(201).json({ 
            message: "Ingredient added successfully",
            ingredientId: result.ingredientId
        });
    } catch (error) {
        console.error("Error adding ingredient:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
}

async function getIngredientDetails(req, res) {
    try {
        const { id } = req.params;
        const ingredient = await databaseService.getIngredientDetails(parseInt(id));
        
        if (!ingredient) {
            return res.status(404).json({ message: "Ingredient not found" });
        }
        
        return res.status(200).json(ingredient);
    } catch (error) {
        console.error("Error fetching ingredient details:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
}

async function updateIngredientDetails(req, res) {
    try {
        const { id } = req.params;
        const { name, category, max, unit } = req.body;
        
        if (!name || !category || !max || !unit) {
            return res.status(400).json({ message: "Name, category, max, and unit are required" });
        }
        
        await databaseService.updateIngredientDetails(parseInt(id), {
            name,
            category,
            max: parseFloat(max),
            unit
        });
        
        return res.status(200).json({ message: "Ingredient details updated successfully" });
    } catch (error) {
        console.error("Error updating ingredient details:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
}

export { getAllIngredients, updateIngredientStock, addIngredient, getIngredientDetails, updateIngredientDetails };