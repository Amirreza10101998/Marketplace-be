import express from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import uniqid from "uniqid"

/*-----Global Functions-----*/
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

  return singleProduct;
}

const saveProducts = async (products) => {
  const productsFilePath = await getProductsFilePath();
  fs.writeFileSync(productsFilePath, JSON.stringify(products));
}

const router = express.Router();

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

export default router;
