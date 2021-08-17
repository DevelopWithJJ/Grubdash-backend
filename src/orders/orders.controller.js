const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

const dishes = require(path.resolve("src/data/dishes-data"));

// TODO: Implement the /orders handlers needed to make the tests pass

//Checks to see if our order has required fields deliverTo, mobileNumber, and dishes
function hasRequiredFields(req, res, next) {
  const data = req.body.data || {};
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];

  //Loop through our array of require fields, and if not present return error with corresponding field
  //not present
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
  }
  //Check to see if dishes is not an array and length is not equal to zero. If either condition met
  //return 400 that user needs to include one dish in order
  const dishes = data.dishes;
  if (!Array.isArray(dishes) || dishes.length == 0) {
    return next({
      status: 400,
      message: "Dish must include at least one dish",
    });
  }
  //set var call FoundProblem to false and then loop through our index holding the value and index
  let foundProblem = false;
  dishes.forEach((dish, index) => {
    //If dish quantity cannot be made to integer, is less than zero, or not present change found problem
    //to true and sedn 400 error.
    if (
      !Number.isInteger(dish.quantity) ||
      dish.quanity < 0 ||
      !dish.quantity
    ) {
      foundProblem = true;
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  //If no problem found save this data to res.locals.data and move down the middleware pipeline.
  res.locals.data = data;
  if (!foundProblem) next();
}

//Checks to see if the order exists, if not return an error. Else save order to res.locals.order for
//future use and continue down middleware pipeline.
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const order = orders.find((order) => order.id === orderId);
  if (!order) {
    next({ status: 404, message: `Order does not exist ${orderId}` });
  } else {
    res.locals.order = order;
    next();
  }
}

//Function checks to see if our status is not equal to pending.
//If status is not equal, user may not delete the order
function statusIsValid(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: `Cannot delete with ${order.status}; status me be pending`,
    });
  }
  next();
}

// Function validates id passed in to our order and also checks status of the order
function idValidator(req, res, next) {
  const {
    data: { id, status },
  } = req.body;
  const { orderId } = req.params;
  //If we have an id, but it does not match our orderId return a 400 error.
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  //If we don't have the status or if status is not one of these strings in the array
  //return a 400 error
  if (
    !status ||
    !["pending", "preparing", "out-for-delivery", "delivered"].includes(status)
  ) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  next();
}
function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const { orderDish } = req.params;
  const dishOrder = orders.find((order) => order.dishes === orderDish);

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function destroy(req, res, next) {
  orders.splice(orders.indexOf(res.locals.order), 1);
  res.sendStatus(204);
}

function update(req, res, next) {
  //Since res.locals.order does not require id, delete id from res.locals.data if presents
  if (res.locals.data.hasOwnProperty("id")) {
    delete res.locals.data.id;
  }
  //Using our res.locals.order as a key, match it with the corresponding res.locals.order
  const updatedOrder = Object.assign(res.locals.order, res.locals.data);
  res.json({ data: updatedOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

module.exports = {
  list,
  create: [hasRequiredFields, create],
  read: [orderExists, read],
  update: [orderExists, hasRequiredFields, idValidator, update],
  delete: [orderExists, statusIsValid, destroy],
};
