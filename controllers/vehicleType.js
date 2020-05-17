const VehicleType = require('../models/vehicleType')
const Op = require('sequelize').Op

// 通过id 查询 车辆类型vehicleType
const findById = async (ctx) => {
    const { id } = ctx.query
    console.log('=========query', ctx.query);
    try {
        // 查询vehicleType
        const vehicleType = await VehicleType.findByPk(id, {

        });

        ctx.body = {
            data: vehicleType,
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
    console.error('query vehicleType');
    const query = ctx.query
    console.log('=========query', ctx.query);

    // 处理查询参数，取交集
    let where = {};
    if (query.id) {
        where = { ...where, id: query.id }
    }
    if (query.cost) {
        where = { ...where, cost: query.cost }
    }
    if (query.load) {
        where = { ...where, load: query.load }
    }


    // 进行查询
    const { rows: data, count: total } = await VehicleType.findAndCountAll({
        where,
        offset: (+query.current - 1) * +query.pageSize,
        limit: +query.pageSize,
        // order: [
        //   ['createdAt', 'DESC']
        // ]
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
    console.log('===========vehicleType params:', params);

    // 判断开销是否为空 
    if (!(params.cost + '')) {
        console.log('cost');
        ctx.body = {
            code: 1001,
            desc: '开销不能为空'
        }
        return false
    }

    // 判断载重是否为空
    if (!(params.load + '')) {
        console.log('load');
        ctx.body = {
            code: 1002,
            desc: '载重不能为空'
        }
        return false
    }


    try {
        console.log('==========开始创建...')
        let vehicleType = await VehicleType.create(params)
        console.log('成功创建vt：', JSON.stringify(vehicleType));
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



// 删除
const destroy = async ctx => {
    await VehicleType.destroy({ where: ctx.request.body })
    ctx.body = {
        code: 1000,
        desc: '删除成功'
    }
}

module.exports = {
    find,
    findById,
    create,
    destroy,
};