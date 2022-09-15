"use strict"

const { Router } = require("express")
const Product = require("./Product")
const amqp = require("amqplib")

const dotenv = require("dotenv")
dotenv.config()

const router = new Router()

const MQ_HOST = process.env.RABBITMQ_HOST
const MQ_PORT = process.env.RABBITMQ_PORT
const MQ_USER = process.env.RABBITMQ_USER
const MQ_PASS = process.env.RABBITMQ_PASS

const connectToRabbitMQ = async () => {
    const amqpServer = `amqp://${MQ_USER}:${MQ_PASS}@${MQ_HOST}:${MQ_PORT}`
    const connection = await amqp.connect(amqpServer)
    const channel = await connection.createChannel()
    await channel.assertQueue("product-service-queue")

    return { channel }
}

const { channel } = connectToRabbitMQ().then()

// create a new product
router.post("/", async (req, res) => {
    const { name, price, description } = req.body
    if (!name || !price || !description) {
        return res.status(422).json({
            message: "Name, price and description are required.",
        })
    }

    const product = await new Product({ ...req.body })
    await product.save()

    return res.status(201).json({
        message: "Product created successfully.",
        product,
    })
})

// buy a product
router.post("/buy", async (req, res) => {
    const { productIds } = req.body
    const products = await Product.find({ _id: { $in: productIds } })

    // send order to rabbitmq order queue
    channel.sendToQueue("order-service-queue", Buffer.from(JSON.stringify(products)))

    // consume previously placed order from rabbitmq and acknowledge the transaction
    let order = null
    channel.consume("product-service-queue", (data) => {
        console.log("Consumed from product service queue")
        order = JSON.parse(data.content)
        channel.ack(data)
    })

    return res.status(201).json({
        message: "Order placed successfully.",
        order,
    })
})

module.exports = router
