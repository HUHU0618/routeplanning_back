/*
 * @Descripttion: 
 * @version: 
 * @Author: huhu
 */

const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')

const index = require('./routes/index')
const users = require('./routes/users')
// 引入路由
const task = require('./routes/task')
const vehicle = require('./routes/vehicle')
const vehicleType = require('./routes/vehicleType')
const routePlanning = require('./routes/routePlanning')

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
app.use(task.routes(), task.allowedMethods())
app.use(vehicle.routes(), vehicle.allowedMethods())
app.use(vehicleType.routes(), vehicleType.allowedMethods())
app.use(routePlanning.routes(), routePlanning.allowedMethods())


// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
