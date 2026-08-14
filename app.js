const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "TechCart",
  });
});

app.get("/api/products", (req, res) => {
  res.json([
    { id: 1, name: "Wireless Headphones", price: 89.99 },
    { id: 2, name: "Mechanical Keyboard", price: 79.99 },
    { id: 3, name: "Wireless Mouse", price: 39.99 },
    { id: 4, name: "HD Webcam", price: 59.99 },
  ]);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TechCart running on http://localhost:${PORT}`);
  });
}

module.exports = app;