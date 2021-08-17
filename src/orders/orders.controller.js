const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

const dishes = require(path.resolve("src/data/dishes-data"));

// TODO: Implement the /orders handlers needed to make the tests pass

function hasRequiredFields(req, res, next) {
  const data = req.body.data || {};
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];

  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
  }
  const dishes = data.dishes;
  if (!Array.isArray(dishes) || dishes.length == 0) {
    return next({
      status: 400,
      message: "Dish must include at least one dish",
    });
  }
  let foundProblem = false;
  dishes.forEach((dish, index) => {
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
  res.locals.data = data;
  if (!foundProblem) next();
}

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

function idValidator(req, res, next) {
  const {
    data: { id, status },
  } = req.body;
  const { orderId } = req.params;
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }

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
  if (res.locals.data.hasOwnProperty("id")) {
    delete res.locals.data.id;
  }
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
