const express = require("express");
const app = express();
const Joi = require("joi");
const multer = require("multer");

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());

const cors = require("cors");
app.use(cors());
const mongoose = require("mongoose");

//NEED MULTER AND CORS AND JOI STUFF

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

mongoose
  .connect(
    "mongodb+srv://lukepalassis:IyaykwOUKzH07dW2@mongodbtest.feccrav.mongodb.net/"
  )
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((error) => {
    console.log("couldn't connect to mongodb", error);
  });

const craftSchema = new mongoose.Schema({
  name: String,
  description: String,
  supplies: [String],
  img: String,
});

const Craft = mongoose.model("Craft", craftSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/api/crafts", (req, res) => {
  getCrafts(res);
});

const getCrafts = async (res) => {
  const crafts = await Craft.find();
  res.send(crafts);
};

app.get("/api/crafts/:id", async (req, res) => {
  getRecipe(req.params.id, res);
});

const getCraft = async (id, res) => {
  const craft = await Craft.findOne({ _id: id });
  res.send(craft);
};

app.post("/api/crafts/", upload.single("img"), async (req, res) => {
  // Validate craft data
  const result = validateCraft(req.body);
  console.log(result);
  if (result.error) {
    // If validation fails, send a JSON response with the error message
    res.status(400).json({ error: result.error.details[0].message });
    return;
  }

  const imageFilename = req.file ? req.file.filename : null;
  console.log(imageFilename);
  const craft = new Craft({
    name: req.body.name,
    description: req.body.description,
    supplies: req.body.supplies.split(","),
    img: imageFilename, // Set imageFilename or null based on whether a file was uploaded
  });
  console.log(craft.img);

  createCraft(craft, res);
});

const createCraft = async (craftData, res) => {
  const craft = new Craft(craftData); // Create a new Craft instance using the Craft model
  try {
    const result = await craft.save();
    res.send(result); // Send the saved craft back as the response
  } catch (error) {
    res.status(500).send(error.message); // Handle any potential errors during save
  }
};

app.put("/api/crafts/:id", upload.single("img"), async (req, res) => {
  console.log("ID FOR CRAFT    " + req.params.id);
  const craft = await Craft.findById(req.params.id);

  if (!craft) {
    res.send(404).send("That specific craft is not in the database");
  }

  const imageFilename = req.file ? req.file.filename : null;
  let fieldsToUpdate = {
    name: req.body.name,
    description: req.body.description,
    supplies: req.body.supplies.split(","),
    img: imageFilename,
  };

  const id = req.params.id;
  const updateResult = await Craft.updateOne(
    { _id: req.params.id },
    fieldsToUpdate
  );

  res.send(updateResult);
});

app.delete("/api/crafts/:id", async (req, res) => {
  const craft = await Craft.findByIdAndDelete(req.params.id);
  res.send(craft);
});

const validateCraft = (craft) => {
  const schema = Joi.object({
    _id: Joi.allow(""),
    supplies: Joi.allow(""),
    name: Joi.string().min(3).required(),
    description: Joi.string().min(3).required(),
  });

  return schema.validate(craft);
};

app.listen(3005, () => {
  console.log(`listening`);
});
