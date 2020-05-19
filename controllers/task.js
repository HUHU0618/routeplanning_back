
const Task = require('../models/task')
const Op = require('sequelize').Op
// var functions = require("ACA.js");


// 通过id 查询 配送点task
const findById = async (ctx) => {
    const { id } = ctx.query
    console.log('=========query', ctx.query);
    try {
        // 查询task
        const task = await Task.findByPk(id, {

        });

        ctx.body = {
            data: task,
            code: 1000,
            desc: 'success'
        }
    } catch (err) {
        const msg = err.errors[0]
        ctx.body = {
            code: 300,
            data: msg.value + msg.message
        }
        return false
    }
}

// 查询
const find = async (ctx) => {
    console.error('query task');
    const query = ctx.query
    console.log('=========query', ctx.query);

    // 处理查询参数，取交集
    let where = {};
    if (query.id) {
        where = { ...where, id: query.id }
    }
    if (query.xaxis) {
        where = { ...where, xaxis: query.xaxis }
    }
    if (query.yaxis) {
        where = { ...where, yaxis: query.yaxis }
    }
    if (query.demand) {
        where = { ...where, demand: query.demand }
    }

    // 进行查询
    const { rows: data, count: total } = await Task.findAndCountAll({
        where,
        offset: (+query.current - 1) * +query.pageSize,
        limit: +query.pageSize,
    })
    ctx.body = {
        data,
        total,
        code: 1000,
        desc: 'success'
    }
}

// 新建
const create = async (ctx) => {
    const params = ctx.request.body
    console.log('===========task params:', params);

    // 判断横坐标是否为空 （可以为0）
    if (!(params.xaxis + '')) {
        console.log('xaxis');
        ctx.body = {
            code: 1001,
            desc: 'xaxis不能为空'
        }
        return false
    }

    // 判断纵坐标是否为空（可以为0）
    if (!(params.yaxis + '')) {
        console.log('yaxis');
        ctx.body = {
            code: 1002,
            desc: 'yaxis不能为空'
        }
        return false
    }

    // 判断需求量是否为空 （可以为0）
    if (!(params.demand + '')) {
        console.log('demand');
        ctx.body = {
            code: 1003,
            desc: 'demand不能为空'
        }
        return false
    }

    try {
        console.log('==========开始创建...')
        let task = await Task.create(params)
        console.log('成功创建t：', JSON.stringify(task));
        ctx.body = {
            code: 1000,
            data: '创建成功'
        }
    }
    catch (err) {
        const msg = err.errors[0]
        ctx.body = {
            code: 300,
            data: msg.value + msg.message
        }
        return false
    }
}

// 更新
const update = async ctx => {

    const params = ctx.request.body
    console.log('params: ', params);

    try {
        await Task.update({ demand: params.demand }, {
            where: { id: params.id },
        })
        ctx.body = {
            code: 1000,
            desc: 'success'
        }
        console.log('修改成功')
    } catch (err) {
        const msg = err.errors[0]
        ctx.body = {
            code: 300,
            data: msg.value + msg.message
        }

        console.log('========== error: ', ctx.body.data)
        throw (400); // 抛出400错误
    }
}


// 删除
const destroy = async ctx => {
    await Task.destroy({ where: ctx.request.body })
    ctx.body = {
        code: 1000,
        desc: '删除成功'
    }
}

// 计数
const count = async ctx => {
    await Task.count();
    ctx.body = {
        code: 1000,
        desc: '计数成功'
    }
}

module.exports = {
    count,
    find,
    findById,
    create,
    update,
    destroy,
};
