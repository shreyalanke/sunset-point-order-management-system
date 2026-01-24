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

export { getAllIngredients };