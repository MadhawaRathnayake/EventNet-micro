const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const eventRoutes = require("./routes/eventRoutes");
const ticketTypeRoutes = require("./routes/ticketTypeRoutes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");


const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/events", eventRoutes);
app.use("/api/events", ticketTypeRoutes);


app.use(notFound);
app.use(errorHandler);


module.exports = app;