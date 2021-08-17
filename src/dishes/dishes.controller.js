const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: dishes });
}

//Check to see if are dishes has required fields, name, description, price, and image_url
function hasRequiredFields(req, res, next) {
  const data = req.body.data || {};
  const requiredFields = ["name", "description", "price", "image_url"];
  //Loop through our array of required fields and if any missing notify user of 400 error and missing field(s)
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Dish must require a ${field}`,
      });
    }
  }
  next();
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  //If price less than zero, dish cannot be created by the user
  if (price < 0) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

//Function checks to see if dish exists to assist our controller functions
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const dish = dishes.find((dish) => dish.id === dishId);
  if (!dish) {
    return next({ status: 404, message: "Not found" });
  } else {
    res.locals.dish = dish;
    next();
  }
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const { dishId } = req.params;
  const dish = dishes.find((dish) => dish.id === dishId);
  //If we have an id, but id does not match user id return 400 error saying dish id and route id off.
  if (id && id !== dish.id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route:${dishId}`,
    });
  }

  //Check to see if price is a number and if it's less than 0. If so, alert user of 400 to insert proper num.
  if (!Number.isInteger(price) || price <= 0) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0,`,
    });
  }
  //Following if statements check property of each dish, if any changes were made set the property
  //to the new value
  if (dish.name !== name) {
    dish.name = name;
  }
  if (dish.description !== description) {
    dish.description = description;
  }
  if (dish.price !== price) {
    dish.price = price;
  }
  if (dish.image_url !== image_url) {
    dish.image_Url = image_url;
  }
  res.json({ data: dish });
}

module.exports = {
  list,
  create: [hasRequiredFields, create],
  read: [dishExists, read],
  update: [dishExists, hasRequiredFields, update],
};
