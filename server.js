const appName = "emoji-encrypt";

const express = require('express');
const app = express();

app.use(express.static(`./dist/${appName}`));

app.get("/*", function(req, res) {
  console.log(req);
  res.sendFile("index.html", {root: `dist/${appName}/`});
});

const port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Server is running on port", port);
});