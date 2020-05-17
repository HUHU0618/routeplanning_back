const router = require('koa-router')()
const VehicleType = require('../controllers/vehicleType')


// 定义路由
router.get('/vehicleType', VehicleType.find)
router.post('/vehicleType/create', VehicleType.create)
router.post('/vehicleType/destroy', VehicleType.destroy)


module.exports = router