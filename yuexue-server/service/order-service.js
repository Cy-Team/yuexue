const orderModel = require('../model/order-model')
const userModel = require('../model/user-model')
const { orderStatus } = require('../utils/constants')
const CustomError = require('../utils/CustomError')

/**
 * 新建订单
 * @param order
 * @returns {Promise.<*>}
 */
async function createOrder(order) {
    let user = await userModel.queryUserById(order.creatorId)
    if (!user) {
        throw new CustomError('用户不存在')
    }
    order.creatorName = user.username
    order.createTime = order.updateTime = new Date();
    order.status = orderStatus.PUBLISHED_UNRECEIVED
    let result = await orderModel.createOrder(order)
    if (result && result.affectedRows) return true
    return false
}

/**
 * 更新订单
 * @param order
 * @returns {Promise.<boolean>}
 */
async function updateOrder(order) {
    let oldOrder = await orderModel.queryOrderById(order.id)
    if (!oldOrder) {
        throw new CustomError('订单不存在')
    }
    oldOrder.updateTime = new Date()
    if (order.startTime) oldOrder.startTime = order.startTime
    if (order.endTime) oldOrder.endTime = order.endTime
    if (order.location) oldOrder.location = order.location
    if (order.remark) oldOrder.remark = order.remark
    let result = await orderModel.updateOrder(oldOrder)
    if (result && result.affectedRows) return true
    return false
}

/**
 * 接单啦
 * @param order
 * @returns {Promise.<boolean>}
 */
async function receiveOrder(order) {
    let oldOrder = await orderModel.queryOrderById(order.id)
    if (!oldOrder) {
        throw new CustomError('订单不存在')
    }
    if (oldOrder.creatorId === order.receiverId) {
        throw new CustomError('不能接受自己的邀约')
    }
    if (oldOrder.status == orderStatus.RECEIVED_UNREAD ||
        oldOrder.status == orderStatus.RECEIVED_READ) {
        throw new CustomError('订单已被其他人抢到啦')
    }
    if (oldOrder.status == orderStatus.PUBLISHED_REMOVED) {
        throw new CustomError('订单已被删除')
    }
    let receiver = await userModel.queryUserById(order.receiverId)
    if (!receiver) {
        throw new CustomError('接单人不存在')
    }
    oldOrder.receiverId = receiver.id
    oldOrder.receiverName = receiver.username
    oldOrder.receiveTime = new Date()
    oldOrder.status = orderStatus.RECEIVED_UNREAD
    let result = await orderModel.updateOrder(oldOrder)
    if (result && result.affectedRows) return true
    return false
}

/**
 * 删除订单
 * @param id
 * @returns {Promise.<boolean>}
 */
async function deleteOrder(userId, orderId) {
    let order = await orderModel.queryOrderById(orderId)
    if (!order) {
        throw new CustomError('订单不存在')
    }
    // 只能删除自己创建的订单
    if (order.creatorId !== userId) {
        throw new CustomError('删除订单不合法')
    }
    let result = await orderModel.deleteOrderById(orderId)
    if (result && result.affectedRows) return true
    return false
}

/**
 * 根据查询条件查询订单
 * @param options
 * @returns {Promise.<*>}
 */
function findOrderByOptions(options) {
    return orderModel.findOrderByOptions(options)
}

async function findCurrentOrders(search, city, start, size) {
    return orderModel.findCurrentOrders(orderStatus.PUBLISHED_UNRECEIVED, search, city, start, size)
}

async function readAllUnreadOrder(userId) {
    let user = await userModel.queryUserById(userId)
    if (!user) {
        throw new CustomError('用户不存在')
    }
    return orderModel.readAllUnreadOrder(userId)
}

module.exports = {
    createOrder,
    updateOrder,
    receiveOrder,
    deleteOrder,
    findOrderByOptions,
    findCurrentOrders,
    readAllUnreadOrder
}