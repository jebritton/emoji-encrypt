const express = require('express');
const app = express();

const appName = "emoji-encrypt";

const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 8080;

app.use(express.static(`./dist/${appName}`));

app.get("/*", function(req, res) {
  console.log(req);
  res.sendFile("index.html", {root: `dist/${appName}/`});
});

const forceSSL = function (req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  return next();
};

if (env === "production") {
  app.use(forceSSL);
}

app.listen(port, function() {
  console.log("Server is running on port", port);
});