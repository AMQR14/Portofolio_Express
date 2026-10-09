require("dotenv").config();

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const app = express();

const PORT = Number(process.env.PORT || 3000);

const db = require("./config/db.js");

const heroRoute = require("./routes/heroRoute.js");
const projectRoute = require("./routes/projectRoute.js");
const messageRoute = require("./routes/messageRoute.js");
const skillRoute = require("./routes/skillRoute.js");
const certificateRoute = require("./routes/certificateRoute.js");
const testimonialRoute = require("./routes/testimonialRoute.js");
const adminRoute = require("./routes/adminRoute.js");
const uploadRoute = require("./routes/uploadRoute.js");
const authRoute = require("./routes/authRoute.js");
const { FRONTEND_ORIGIN } = require("./middleware/adminAuth.js");

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use("/uploads", uploadRoute);
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), {
  fallthrough: false,
  index: false,
}));

app.use(heroRoute);
app.use(projectRoute);
app.use(messageRoute);
app.use(skillRoute);
app.use(certificateRoute);
app.use(testimonialRoute);
app.use(adminRoute);
app.use(authRoute);

app.get('/', (req, res) => {
  res.send('Selamat Datang di Backend Portofolio')
})

// Vercel runs this app as a serverless function, so it must export `app`
// and must not start its own server. Locally we still listen as before.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
