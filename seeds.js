// seeding DB separately from express

const mongoose = require("mongoose");
const Product = require("./models/product");

mongoose.connect('mongodb://localhost:27017/farmStand', {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log("Connection with DB opened."))
    .catch(err => console.log("Connection with DB failed."));

/*
const p = new Product({
    name : "Cucumber", 
    price : 1.5, 
    category : "vegetable"
});
p.save()
    .then(data => console.log(data))
    .catch(err => console.log("Smth went wrong with data saving!"));
*/

const seedProducts = [
    {
        name : "Fairy Eggplant",
        price : 1.00,
        category : "vegetable"
    },
    {
        name : "Organic Goddess Melon",
        price : 4.99,
        category : "fruit"
    },
    {
        name : "Organic Mini Seedless Watermelon",
        price : 3.99,
        category : "vegetable"
    },
    {
        name : "Organic Celery",
        price : 1.50,
        category : "fruit"
    },
    {
        name : "Chocolate Whole Milk",
        price : 2.69,
        category : "dairy"
    },

];
Product.insertMany(seedProducts)
    .then(response => console.log(response))
    .catch(err => console.log("Error in inserting"))