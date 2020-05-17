const router = require('koa-router')()
const routePlanning = require('../controllers/routePlanning')

// 定义路由
router.post('/routePlanning', routePlanning.getPath)
// router.get('/task', Task.find)
// router.post('/task/update', Task.update)


module.exports = router