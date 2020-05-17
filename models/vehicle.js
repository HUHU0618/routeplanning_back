const sequelize = require('../utils/sequelize')
const Sequelize = require('sequelize')
const moment = require('moment') // 日期处理库
const VehicleType = require('./vehicleType')


// 定义表结构
const Vehicle = sequelize.define('Vehicle', {
    // 车辆id
    id: {
        type: Sequelize.INTEGER, // 设置字段类型
        primaryKey: true, // 设置为主键
        autoIncrement: true // 自增
    },

    // 车辆型号id
    typeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        get() {
            // this.getDataValue 获取当前字段value
            return moment(this.getDataValue('createdAt')).format('YYYY-MM-DD HH:mm')
        }
    },

    updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        get() {
            return moment(this.getDataValue('updatedAt')).format('YYYY-MM-DD HH:mm')
        }
    }
},
    {
        // sequelize会自动使用传入的模型名（define的第一个参数）的复数做为表名 设置true取消默认设置
        freezeTableName: true,
        // createdAt: 'create_time',
        // updatedAt: 'update_time',
    })

// 建立Vehicle到VehicleType的关联关系
// Vehicle.hasOne(VehicleType);

module.exports = Vehicle;