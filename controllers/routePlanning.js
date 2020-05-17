// controller内
const init = require('../ACA').init // ACA的相对路径
const Task = require('../models/task')
const Vehicle = require('../models/vehicle')
const Op = require('sequelize').Op


// 初始化配送点集合矩阵  

function initTaskArray(taskNum) {
    let randomArray = [];
    // 0 号为配送中心
    randomArray.push(0);
    for (let i = 1; i < taskNum; ++i) {
        // randomArray.push(random(range[0], range[1]));
        // Task.findById(i).getDataValue('demand');
        randomArray.push(Task.findById(i).getDataValue('demand'));
    }
    console.log('task' + randomArray);
    return randomArray;
}


// 初始化车辆 载重 集合矩阵
function initLoadArray(length) {
    let randomArray = [];
    for (let i = 1; i <= length; ++i) {
        // randomArray.push(random(range[0], range[1]));
        const { id } = Vehicle.findById(i).getDataValue('typeId');
        randomArray.push(VehicleType.findById(id).getDataValue('load'));
    }
    return randomArray;
}


// 初始化车辆类型 开销 集合矩阵
function initCostArray(length) {
    let randomArray = [];
    for (let i = 1; i <= length; ++i) {
        // randomArray.push(random(range[0], range[1]));
        const { id } = Vehicle.findById(i).getDataValue('typeId');
        randomArray.push(VehicleType.findById(id).getDataValue('cost'));
    }
    return randomArray;
}

/**
 * 初始化配送点间路径矩阵
 * @param n 列数 配送点数 taskNum
 */
function initRouteMatrix(n) {

    // * @param n 行数 配送点数 taskNum
    let routeMatrix = initMatrix(n, n, 0);
    routeMatrix[0][0] = Number.MAX_VALUE;

    // 配送中心 到 配送点 之间到距离
    for (let taskCount = 1; taskCount < n; ++taskCount) {

        const { tx } = Task.findById(taskCount).getDataValue('xaxis');
        const { ty } = Task.findById(taskCount).getDataValue('yaxis');
        routeMatrix[taskCount][0] = tx * tx + ty * ty;
        routeMatrix[0][taskCount] = routeMatrix[taskCount][0];

    }

    // 循环 配送点间的距离
    for (let taskCount = 1; taskCount < n; ++taskCount) {

        for (let rowCount = 1; rowCount <= taskCount; ++rowCount) {
            if (taskCount == rowCount) {
                routeMatrix[taskCount][rowCount] = Number.MAX_VALUE;
            }
            else {
                const { tx } = Task.findById(taskCount).getDataValue('xaxis');
                const { ty } = Task.findById(taskCount).getDataValue('yaxis');
                const { rx } = Task.findById(rowCount).getDataValue('xaxis');
                const { ry } = Task.findById(rowCount).getDataValue('yaxis');
                routeMatrix[taskCount][rowCount] = (tx - rx) * (tx - rx) + (ty - ry) * (ty - ry);
                routeMatrix[rowCount][taskCount] = routeMatrix[taskCount][rowCount];
            }

        }

    }
    return routeMatrix;
}


// 查询
const getPath = async (ctx) => {
    let taskNum = await Task.count({});
    taskNum += 1;

    let nodeNum = await Vehicle.count({});

    //  初始化配送点合集
    let tasks = initTaskArray(taskNum);

    // 初始化车辆 载重 合集
    let nodes = initLoadArray(nodeNum);

    // 初始化车辆油耗合集
    let nodeCost = initCostArray(nodeNum);

    // 初始化配送点距离矩阵
    let nodeMatrix = initRouteMatrix(taskNum);
    // console.log(nodeMatrix);

    const path = init(tasks, nodes, nodeCost, nodeMatrix, taskNum, nodeNum);

    ctx.body = {
        data: path,
        total,
        code: 1000,
        desc: 'success'
    }
}

module.exports = {
    getPath
};