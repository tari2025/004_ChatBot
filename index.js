const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json();
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect("/index.html");
});



 