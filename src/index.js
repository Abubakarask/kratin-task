const express = require("express");
const bodyParser = require("body-parser");
const router = require("./routes/routes")
const path = require('path')
const cookie_parser = require('cookie-parser')
const dotenv = require("dotenv");

dotenv.config({path:path.join(__dirname, "../config.env")});

const app = express();
const port = 3000

app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({extended: true}));
const viewPath = path.join(__dirname, "../views");
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));
app.set("views", viewPath);
app.use(cookie_parser());

app.use(function authenticate_user(req, res, next) {
  //console.log(res)
  const token = req.cookies?.kratinCookie;
  if (token) {
      res.locals.isAuthenticated = true;
  }
  else {
      res.locals.isAuthenticated = false;
  }
  next();
});

app.use('/', router)

app.listen(port || process.env.PORT, function() {
  console.log("Server started on port 3000");
});
