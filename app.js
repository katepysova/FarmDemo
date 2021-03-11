const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const AppError = require("./AppError");

const port = 8080;
const {Product, categories}  = require("./models/product");
const Farm = require("./models/farm");

mongoose.connect('mongodb://localhost:27017/farmStand', {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log("Connection with DB opened."))
    .catch(err => console.log("Connection with DB failed."));

const app = express();
app.set("views", path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const sessionOptions = {
    secret : "secretmessage",
    resave : false,
    saveUninitialized : false
};
app.use(session(sessionOptions));
app.use(flash());

app.use((req, res, next) => {
    // have access to messages to every single template
    res.locals.messages = req.flash("success")
    next();
})

function wrapAsync(func){
    return function(req, res, next){
        func(req, res, next).catch(err => next(err));
    }
}
// Farm Routes

app.get("/farms", async (req, res) => {
    const farms = await Farm.find();
    res.render("farms/index.ejs", {farms});
})

app.post("/farms", async (req, res) => {
    const data = req.body;
    const farm = new Farm(data);
    await farm.save();
    req.flash("success", "Successfully made a farm.");
    res.redirect('/farms');
})
app.get("/farms/new", (req, res) => {
    res.render("farms/new.ejs");
})
app.delete('/farms/:id', async (req, res) => {
    const id = req.params.id;
    // See findOneAndDelete middleware in farm.js
    const farm = await Farm.findByIdAndDelete(id);
    res.redirect("/farms");
})
app.get("/farms/:id", async (req, res) => {
    const id = req.params.id;
    const farm = await Farm.findById(id).populate("products");
    res.render("farms/show.ejs", {farm});
})
app.post("/farms/:id/products", async (req, res) => {
    const id = req.params.id;
    const {name, price, category} = req.body;
    const farm = await Farm.findById(id);
    const product = new Product({name, price, category});
    farm.products.push(product);
    product.farm = farm;
    await farm.save();
    await product.save();
    res.redirect(`/farms/${id}`);
})
app.get("/farms/:id/products/new", async (req, res) => {
    const id = req.params.id;
    const farm = await Farm.findById(id);
    res.render("products/new.ejs", {categories, farm});
})


// Product Routes
app.get('/products', wrapAsync(async (req, res) => {
    const {category} = req.query;
    if (category){
        const products = await Product.find({category});

         res.render("products/index.ejs", {products, category});
    } else {
        const products = await Product.find();
        res.render("products/index.ejs", {products, category : "All"});
        } 
}));
app.post('/products', wrapAsync(async (req, res, next) => {
    const data = req.body;
    const newProduct = new Product(data);
    await newProduct.save();
    res.redirect('/products');
}));
app.get('/products/new', (req, res) => {
    res.render("products/new.ejs", {categories});
});
app.get('/products/:id', wrapAsync(async (req, res, next) => {
    const id = req.params.id;
    const product = await Product.findById(id).populate("farm");
    res.render("products/show.ejs", {product})
}));
app.patch('/products/:id', wrapAsync( async (req, res) => {
    const id = req.params.id;
    await Product.findByIdAndUpdate(id, req.body, {runValidators : true});
    res.redirect("/products");
}));
app.delete('/products/:id', wrapAsync (async (req, res, next) => {
    const id = req.params.id;
    await Product.findByIdAndDelete(id);
    res.redirect("/products");
}));
app.get('/products/:id/edit', wrapAsync(async (req, res) => {
    const id = req.params.id;
    const product = await Product.findById(id);
    res.render("products/edit.ejs", { product, categories })
}));

const handleValidationError = err => {
    console.log(err);
    return err;
}
app.use((err, req, res, next) => {
    console.log(err.name);
    if(err.name === "ValidationError"){
        handleValidationError(err);
    }
    next(err);
});
app.use((err, req, res, next) => {
    // default 500, "Something went wrong"
    const {status = 500, message = "Something went wrong"} = err;
    res.status(status).send(message);
});

app.listen(port, (req, res) => {
    console.log(`Connected to server on port ${port}.`);
});