const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const invoiceRoutes = require("./routes/invoiceRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const clientRoutes = require("./routes/clientRoutes");
const itemRoutes = require("./routes/itemRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const authRoutes = require("./routes/authRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const purchaseOrdersRoutes = require("./routes/purchaseOrdersRoutes");
const expensesRoutes = require("./routes/expensesRoutes")
const reportRoutes = require("./routes/reportsRoutes")

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Allowed origins (add more later if needed)
const allowedOrigins = [
  "http://localhost:5173",                    // Vite dev
  "https://paripoorna-s299.vercel.app",       // Your production frontend
];

// CORS Configuration — PATCH is now included!
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // PATCH ADDED HERE
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser (only once!)
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend server running ✅");
});

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/invoice", invoiceRoutes);
app.use('/api/quotation', quotationRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/auth', authRoutes)
app.use('/api/settings', settingsRoutes);
app.use('/api/items', itemRoutes)
app.use('/api/payments',paymentRoutes)
app.use('/api/purchase-orders', purchaseOrdersRoutes)
app.use('/api/expenses', expensesRoutes)
app.use('/api/reports',reportRoutes)

// Optional: Global error handler for CORS errors (nice to have)
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS policy violation" });
  }
  console.error(err);
  res.status(500).json({ message: "Server Error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});