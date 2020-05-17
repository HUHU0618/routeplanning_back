
const router = require('koa-router')()
const Vehicle = require('../controllers/vehicle')


// 定义路由
router.get('/vehicle', Vehicle.find)
router.post('/vehicle/create', Vehicle.create)
router.post('/vehicle/destroy', Vehicle.destroy)
router.post('/vehicle/count', Vehicle.count)

module.exports = router