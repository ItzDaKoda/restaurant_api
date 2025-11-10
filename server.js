// server.js — Tasty Bites API (logging, validation, helpful errors, metrics)

const express = require("express");
const { body, param, validationResult } = require("express-validator");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   In-memory data store
   (starter data provided in your template)
   ========================= */
const menuItems = [
  {
    id: 1,
    name: "Classic Burger",
    description:
      "Beef patty with lettuce, tomato, and cheese on a sesame seed bun",
    price: 12.99,
    category: "entree",
    ingredients: ["beef", "lettuce", "tomato", "cheese", "bun"],
    available: true,
  },
  {
    id: 2,
    name: "Chicken Caesar Salad",
    description:
      "Grilled chicken breast over romaine lettuce with parmesan and croutons",
    price: 11.5,
    category: "entree",
    ingredients: [
      "chicken",
      "romaine lettuce",
      "parmesan cheese",
      "croutons",
      "caesar dressing",
    ],
    available: true,
  },
  {
    id: 3,
    name: "Mozzarella Sticks",
    description: "Crispy breaded mozzarella served with marinara sauce",
    price: 8.99,
    category: "appetizer",
    ingredients: ["mozzarella cheese", "breadcrumbs", "marinara sauce"],
    available: true,
  },
  {
    id: 4,
    name: "Chocolate Lava Cake",
    description:
      "Warm chocolate cake with molten center, served with vanilla ice cream",
    price: 7.99,
    category: "dessert",
    ingredients: ["chocolate", "flour", "eggs", "butter", "vanilla ice cream"],
    available: true,
  },
  {
    id: 5,
    name: "Fresh Lemonade",
    description: "House-made lemonade with fresh lemons and mint",
    price: 3.99,
    category: "beverage",
    ingredients: ["lemons", "sugar", "water", "mint"],
    available: true,
  },
  {
    id: 6,
    name: "Fish and Chips",
    description: "Beer-battered cod with seasoned fries and coleslaw",
    price: 14.99,
    category: "entree",
    ingredients: ["cod", "beer batter", "potatoes", "coleslaw", "tartar sauce"],
    available: false,
  },
];

/* =========================
   Middleware: basics
   ========================= */
app.use(express.json());

// Attach a per-request ID for tracing (uses Node's built-in randomUUID)
app.use((req, res, next) => {
  const rid = crypto.randomUUID();
  req.requestId = rid;
  res.setHeader("X-Request-Id", rid);
  next();
});

/* =========================
   Middleware: request logging + hit counting
   ========================= */
// Map like { "GET /api/menu": 12, "GET /api/menu/:id": 9, ... }
const hitCounts = {};

function normalizePath(path) {
  // Replace numeric path segments with :id for nicer metrics buckets
  return path.replace(/\/\d+(\b|$)/g, "/:id");
}

app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  const normalized = `${req.method} ${normalizePath(req.path)}`;
  hitCounts[normalized] = (hitCounts[normalized] || 0) + 1;

  const base = `[${ts}] ${req.method} ${req.originalUrl} (id=${req.requestId})`;
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    console.log(`${base} body=`, req.body);
  } else {
    console.log(base);
  }
  next();
});

/* =========================
   Validation helpers
   ========================= */
const CATEGORIES = ["appetizer", "entree", "dessert", "beverage"];

const validateIdParam = [
  param("id").isInt({ gt: 0 }).toInt().withMessage("id must be a positive integer"),
];

const createOrUpdateValidators = [
  body("name")
    .isString().withMessage("name must be a string")
    .trim()
    .isLength({ min: 3 }).withMessage("name must be at least 3 characters"),
  body("description")
    .isString().withMessage("description must be a string")
    .trim()
    .isLength({ min: 10 }).withMessage("description must be at least 10 characters"),
  body("price")
    .isFloat({ gt: 0 }).withMessage("price must be a number > 0")
    .toFloat(),
  body("category")
    .isString().withMessage("category must be a string")
    .isIn(CATEGORIES).withMessage(`category must be one of: ${CATEGORIES.join(", ")}`),
  body("ingredients")
    .isArray({ min: 1 }).withMessage("ingredients must be a non-empty array"),
  body("ingredients.*")
    .isString().withMessage("each ingredient must be a string")
    .trim()
    .isLength({ min: 1 }).withMessage("ingredient entries cannot be empty"),
  body("available")
    .optional()
    .isBoolean().withMessage("available must be a boolean")
    .toBoolean(),
];

// Central place to return consistent validation errors
function handleValidationErrors(req, res, next) {
  const errs = validationResult(req);
  if (errs.isEmpty()) return next();

  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      details: errs.array().map(e => ({
        field: e.path,
        msg: e.msg,
      })),
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
}

/* =========================
   Routes
   ========================= */

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Metrics: see which endpoints are hit most
app.get("/api/metrics", (_req, res) => {
  const sorted = Object.entries(hitCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([endpoint, count]) => ({ endpoint, count }));
  res.status(200).json({ hits: sorted });
});

// GET all menu items
app.get("/api/menu", (_req, res) => {
  res.status(200).json(menuItems);
});

// GET one by ID
app.get("/api/menu/:id", validateIdParam, handleValidationErrors, (req, res) => {
  const id = req.params.id;
  const item = menuItems.find(m => m.id === id);
  if (!item) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Menu item ${id} not found.`,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }
  res.status(200).json(item);
});

// POST create
app.post(
  "/api/menu",
  createOrUpdateValidators,
  handleValidationErrors,
  (req, res) => {
    const { name, description, price, category, ingredients } = req.body;
    const available =
      typeof req.body.available === "boolean" ? req.body.available : true;

    const nextId = (menuItems.at(-1)?.id || 0) + 1;
    const item = {
      id: nextId,
      name,
      description,
      price,
      category,
      ingredients,
      available,
    };
    menuItems.push(item);
    res.status(201).json(item);
  }
);

// PUT update
app.put(
  "/api/menu/:id",
  [...validateIdParam, ...createOrUpdateValidators],
  handleValidationErrors,
  (req, res) => {
    const id = req.params.id;
    const idx = menuItems.findIndex(m => m.id === id);
    if (idx === -1) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Menu item ${id} not found.`,
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { name, description, price, category, ingredients } = req.body;
    const available =
      typeof req.body.available === "boolean" ? req.body.available : menuItems[idx].available;

    const updated = {
      ...menuItems[idx],
      name,
      description,
      price,
      category,
      ingredients,
      available,
    };
    menuItems[idx] = updated;
    res.status(200).json(updated);
  }
);

// DELETE remove
app.delete(
  "/api/menu/:id",
  validateIdParam,
  handleValidationErrors,
  (req, res) => {
    const id = req.params.id;
    const idx = menuItems.findIndex(m => m.id === id);
    if (idx === -1) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Menu item ${id} not found.`,
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
    const [deleted] = menuItems.splice(idx, 1);
    res.status(200).json({ deleted });
  }
);

/* =========================
   404 + Error handler
   ========================= */

// 404 for any other route
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found.`,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

// Defensive error handler (consistent, actionable)
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        "An unexpected error occurred. Please retry, and contact support if it persists.",
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

/* =========================
   Start server
   ========================= */
app.listen(PORT, () => {
  console.log(`Tasty Bites API listening on http://localhost:${PORT}`);
});
