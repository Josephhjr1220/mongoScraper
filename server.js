// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
// Requiring our models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));

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
};
// End database configuration

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function (error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function () {
    console.log("Mongoose connection successful.");
});

// Routes
// index route loads index.html
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

// A GET request to scrape reddit
app.get("/scrape", function (req, res) {
    //grab the body of the html with request
    request("https://www.reddit.com/r/webdev", function (error, response, html) {
        //load that into cheerio 
        var $ = cheerio.load(html);
        //grab every p within an title tag
        $("p.title").each(function (i, element) {

            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children("a").text();
            result.link = $(this).children("a").attr("href");

            // Using our Article model, create a new entry
            var entry = new Article(result);

            //save entry to the db
            entry.save(function (err, doc) {
                // Log any errors
                if (err) {
                    console.log(err);
                }
                // Or log the doc
                else {
                    console.log(doc);
                }
            });

        });
    });
    //finish scraping
    res.send("Scrape Complete");

});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function (req, res) {
    // Grab every doc in the Articles array
    Article.find({}, function (error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Or send the doc to the browser as a json object
        else {
            res.json(doc);
        }
    });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    Article.findOne({ "_id": req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        // now, execute our query
        .exec(function (error, doc) {
            // Log any errors
            if (error) {
                console.log(error);
            }
            // Otherwise, send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    var newNote = new Note(req.body);

    // And save the new note the db
    newNote.save(function (error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Otherwise
        else {
            // Use the article id to find and update it's note
            Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
                // Execute the above query
                .exec(function (err, doc) {
                    // Log any errors
                    if (err) {
                        console.log(err);
                    }
                    else {
                        // Or send the document to the browser
                        res.send(doc);
                    }
                });
        }
    });
});


// Listen on port 3000
app.listen(3000, function () {
    console.log("App running on port 3000!");
});