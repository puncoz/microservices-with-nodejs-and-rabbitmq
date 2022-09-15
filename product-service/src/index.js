"use strict"

const express = require("express")
const productRouter = require("./routes")
const mongoose = require("mongoose")

const dotenv = require("dotenv")
dotenv.config()

const APP_PORT = process.env.PORT
const MONGO_HOST = process.env.MONGO_HOST
const MONGO_PORT = process.env.MONGO_PORT
const MONGO_DB_NAME = process.env.MONGO_DB_NAME

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use("/product", productRouter)

mongoose
    .connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Product service connected to mongodb"))
    .catch((e) => console.error(e))

app.listen(APP_PORT)

