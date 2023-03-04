import express from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import uniqid from "uniqid"
import { parseFile, uploadImage } from "../utilities/uploads/index.js"

/*----------Global Functions----------*/
const getProductsFilePath = () => {
  const _filename = fileURLToPath(import.meta.url);
  const _dirname = dirname(_filename);
  const productsFilePath = path.join(_dirname, "products.json");

  return productsFilePath;
};

const getProducts = async () => {
  const productsFilePath = await getProductsFilePath();
  const fileAsBuffer = fs.readFileSync(productsFilePath);
  const fileAsString = fileAsBuffer.toString();
  const fileAsJSON = JSON.parse(fileAsString);

  return fileAsJSON;
};

const getProductsArray = () => {
  const fileAsBuffer = fs.readFileSync(getProductsFilePath());
  const fileAsString = fileAsBuffer.toString();
  const fileAsJSONArray = JSON.parse(fileAsString);
    
  return fileAsJSONArray;
};

const getProductById = async (id) => {
  const products = await getProducts();
  const singleProduct = products.find((singleProduct) => singleProduct.id === id);

  if (!singleProduct) {
    return null;
  }

  const reviews = getReviewsArray().filter((review) => review.productId === id);

  return { ...singleProduct, reviews };
};

const saveProducts = async (products) => {
  const productsFilePath = await getProductsFilePath();
  fs.writeFileSync(productsFilePath, JSON.stringify(products));
}

const getReviewsFilePath = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const reviewsFilePath = path.join(__dirname, "reviews.json");

  return reviewsFilePath
};

const getReviewsArray = () => {
  const fileAsBuffer = fs.readFileSync(getReviewsFilePath());
  const fileAsString = fileAsBuffer.toString();
  const fileAsJSONArray = JSON.parse(fileAsString);

  return fileAsJSONArray;
}

const saveReviews = async (reviews) => {
  const reviewsFilePath = await getReviewsFilePath();
  fs.writeFileSync(reviewsFilePath, JSON.stringify(reviews));
};

const router = express.Router();

/*----------Products----------*/
/* 1. Returns list of products */
router.get("/", async (req, res, next) => {
  try {
    const fileAsJSON = await getProducts();
    res.send(fileAsJSON);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

/* 2. Returns single product */
router.get("/:id", async (req, res, next) => {
  try {
    const singleProduct = await getProductById(req.params.id);

    if (!singleProduct) {
      res.status(404).send({ message: `Product with id ${req.params.id} not found` });
      return;
    }

    res.send(singleProduct);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

/* 3. Creates a new product */
router.post("/", async (req, res, next) => {
  try {
    const newProduct = {
      id: uniqid(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const products = await getProductsArray();
    products.push(newProduct);
    await saveProducts(products);

    res.send(newProduct);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

/* 4. Updates a product */
router.put("/:id", async (req, res, next) => {
  try {
    const products = await getProductsArray();
    const index = products.findIndex((product) => product.id === req.params.id);

    if (index === -1) {
      res.status(404).send({ message: `Product with id ${req.params.id} not found` });
      return;
    }

    const updatedProduct = { ...products[index], ...req.body, updatedAt: new Date() };
    products[index] = updatedProduct;
    await saveProducts(products);

    res.send(updatedProduct);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

/* 5. Upload an image */
router.post("/:id/upload", parseFile.single("upload"), async (req, res, next) => {
  try {
    const productId = req.params.id;
    const products = await getProductsArray();

    const productIndex = products.findIndex((product) => product.id === productId);
    if (productIndex === -1) {
      return res.status(404).send({ message: `Product with id ${productId} not found` });
    }

    const image = req.file;
    if (!image) {
      return res.status(400).send({ message: "Image file is required" });
    }

    // Save image to disk or cloud storage and get link
    const imageUrl = await uploadImage(req, res, next);

    // Update product's image URL
    products[productIndex].imageUrl = imageUrl;
    products[productIndex].updatedAt = new Date();

    await saveProducts(products);

    res.send({ message: "Product image updated successfully", product: products[productIndex] });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

/*----------Reviews----------*/
/* 1. Post a product review */
router.post("/:productId/reviews", async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const products = await getProductsArray();

    const productIndex = products.findIndex((product) => product.id === productId);
    if (productIndex === -1) {
      return res.status(404).send({ message: `Product with id ${productId} not found` });
    }

    const newReview = {
      id: uniqid(),
      ...req.body,
      productId: productId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const reviews = getReviewsArray();
    reviews.push(newReview);
    await saveReviews(reviews);

    res.send(newReview);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

export default router;
