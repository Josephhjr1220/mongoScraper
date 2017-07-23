// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
// Requiring our Note and Article models
// var Note = require("./models/.js");
// var Article = require("./models/.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();

app.use(bodyParser.urlencoded({ extended: false}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with Mongoose 
if (process.env.MONGODB_URI) {
// Executes if executed in Heroku
    mongoose.connect(process.env.MONGODB_URI);
} 
else {
// Executes if executed locally
   var promise = mongoose.connect("mongodb://localhost/mongoScraper", {
    useMongoClient: true
   });
}
// End database configuration

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// Routes
