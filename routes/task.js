const router = require('koa-router')()
const Task = require('../controllers/task')


// 定义路由
router.get('/task', Task.find)
router.post('/task/update', Task.update)
router.post('/task/create', Task.create)
router.post('/task/destroy', Task.destroy)
router.post('/task/count', Task.count)

module.exports = router 