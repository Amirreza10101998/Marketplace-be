import path, { dirname, extname } from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs"

export const getPublicFilePath = () => {
    const _filename = fileURLToPath(import.meta.url);
    const _dirname = dirname(_filename);
    const publicFilePath = path.join(_dirname, "../../../public");
  
    return publicFilePath;
  };

export const parseFile = multer();

export const uploadImage = (req, res, next) => {
    try {
      const { originalname, buffer } = req.file;
      const extname = path.extname(originalname);
      const fileName = `${req.params.id}${extname}`;
      const pathToFile = path.join(getPublicFilePath(), fileName);
      fs.writeFileSync(pathToFile, buffer);
      const link = `http://localhost:3001/${fileName}`;
  
      // Return link to image
      return link;
    } catch (error) {
      console.log(error);
    }
  };
  
  


