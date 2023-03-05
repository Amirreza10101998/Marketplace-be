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

const getProductsArray = () => {
  const fileAsBuffer = fs.readFileSync(getProductsFilePath());
  const fileAsString = fileAsBuffer.toString();
  const fileAsJSONArray = JSON.parse(fileAsString);
    
  return fileAsJSONArray;
};

const getProductById = async (id) => {
  const products = await getProductsArray();
  const singleProduct = products.find((singleProduct) => singleProduct.id === id);

  if (!singleProduct) {
    return null;
  }

  return {singleProduct};
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

const getReviews = () => {
  const fileAsBuffer = fs.readFileSync(getReviewsFilePath());
  const fileAsString = fileAsBuffer.toString();
  const fileAsJSONArray = JSON.parse(fileAsString);

  return fileAsJSONArray;
}

const getReviewsById = async (id) => {
  const reviews = await getReviews();
  const singleReview = reviews.find((singleReview) => singleReview.id === id);

  if (!singleReview) {
    return null
  }

  return {singleReview}
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
    const fileAsJSON = await getProductsArray();
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

    const reviews = getReviews();
    reviews.push(newReview);
    await saveReviews(reviews);

    res.send(newReview);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

/* 2. Get a list of product reviews */
router.get("/:productId/reviews", async (req,res,next) => {
  try {
    const fileAsJSON = await getReviews();
    res.send(fileAsJSON) 
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

/* 3. Get a single product reviews */
router.get("/:productId/reviews/:reviewId", async (req, res, next) => {
  try {
    
    // Retrieve the product with the specified ID from the database
    const product = await getProductById(req.params.productId);

    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    const review = await getReviewsById(req.params.reviewId);

    if (!review) {
      return res.status(404).send({ message: "Review not found" });
    }

    res.send(review);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// 4. Update a review for a specific product
router.put("/:productId/reviews/:reviewId", async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const reviewId = req.params.reviewId;

    // Check if product with specified productId exists
    const product = await getProductById(productId);
    if (!product) {
      res.status(404).send({ message: `Product with id ${productId} not found` });
      return;
    }

    const reviews = await getReviews();
    const index = reviews.findIndex((review) => review.id === reviewId);

    if (index === -1) {
      res.status(404).send({ message: `Review with id ${reviewId} not found` });
      return;
    }

    const updatedReview = { ...reviews[index], ...req.body, updatedAt: new Date() };
    reviews[index] = updatedReview;
    await saveReviews(reviews);

    res.send(updatedReview);
  } catch (error) {
    next(error);
  }
});

// 5. Delete a review for a specific product
router.delete("/:productId/reviews/:reviewId", async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const reviewId = req.params.reviewId;

    const product = await getProductById(productId);
    if (!product) {
      res.status(404).send({ message: `Product with id ${productId} not found` });
      return;
    }

    const reviews = await getReviews();
    const index = reviews.findIndex((review) => review.id === reviewId);

    if (index === -1) {
      res.status(404).send({ message: `Review with id ${reviewId} not found` });
      return;
    }

    reviews.splice(index, 1);
    await saveReviews(reviews);

    res.send({ message: `Review with id ${reviewId} has been deleted` });
  } catch (error) {
    next(error);
  }
});

export default router;


