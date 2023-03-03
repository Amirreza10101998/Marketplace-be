import express from "express";
import cors from "cors"
import listEndpoints from "express-list-endpoints";

/*-----Imported Routers-----*/
import productsRouter from "./products/index.js"

/*-----Imported Error Handlers-----*/

const server = express();
const port = 3001;

server.use(cors());
server.use(express.json());

/*-----Routers-----*/
server.use("/products", productsRouter);

console.table(listEndpoints(server));

server.listen(port, () => console.log(`server is running on port: ${port}`));
