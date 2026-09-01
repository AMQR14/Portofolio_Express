const express = require("express");
const cors = require('cors');
const app = express();

const PORT = 3000;

const db = require("./config/db.js");

const heroRoute = require("./routes/heroRoute.js");
const projectRoute = require("./routes/projectRoute.js");
const messageRoute = require("./routes/messageRoute.js");

app.use(cors());
app.use(express.json());

app.use(heroRoute);
app.use(projectRoute);
app.use(messageRoute);

app.get('/', (req, res) => {
  res.send('Selamat Datang di Backend Portofolio')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
