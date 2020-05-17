const Vehicle = require('../models/vehicle')
const Op = require('sequelize').Op

// 通过id 查询 车辆vehicle
const findById = async (ctx) => {
    const { id } = ctx.query
    console.log('=========query', ctx.query);
    try {
        // 关联查询vehicle和vehicleType
        const vehicle = await Vehicle.findByPk(id, {

        });

        ctx.body = {
            data: vehicle,
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
    console.error('query vehicle');
    const query = ctx.query
    console.log('=========query', ctx.query);

    // 处理查询参数，取交集
    let where = {};
    if (query.id) {
        where = { ...where, id: query.id }
    }
    if (query.typeId) {
        where = { ...where, typeId: query.typeId }
    }

    // 进行查询
    const { rows: data, count: total } = await Vehicle.findAndCountAll({
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
    console.log('===========vehicle params:', params);

    // 判断车辆型号是否为空 
    if (!(params.typeId + '')) {
        console.log('typeId');
        ctx.body = {
            code: 1001,
            desc: 'typeId不能为空'
        }
        return false
    }


    try {
        console.log('==========开始创建...')
        let vehicle = await Vehicle.create(params)
        console.log('成功创建v：', JSON.stringify(vehicle));
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
    await Vehicle.destroy({ where: ctx.request.body })
    ctx.body = {
        code: 1000,
        desc: '删除成功'
    }
}

// 计数
const count = async ctx => {
    await Vehicle.count();
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
    destroy,
};