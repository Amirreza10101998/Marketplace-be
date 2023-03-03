import express from "express";
import cors from "cors"
import listEndpoints from "express-list-endpoints";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

/*-----Imported Routers-----*/
import productsRouter from "./products/index.js"


/*-----Imported Error Handlers-----*/

const server = express();
const port = 3001;

server.use(cors());
server.use(express.json());


const getPublicFilePath = () => {
  const _filename = fileURLToPath(import.meta.url);
  const _dirname = dirname(_filename);
  const publicFilePath = path.join(_dirname, "../public");

  return publicFilePath;
};

server.use(express.static(getPublicFilePath()));

/*-----Routers-----*/
server.use("/products", productsRouter);


console.table(listEndpoints(server));

server.listen(port, () => console.log(`server is running on port: ${port}`));
