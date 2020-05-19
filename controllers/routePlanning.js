// controller内
// const init = require('../ACA').init // ACA的相对路径
const Task = require('../models/task')
const Vehicle = require('../models/vehicle')
const VehicleType = require('../models/vehicleType')
const Op = require('sequelize').Op

/**
 * 初始化一个二维数组
 * @param n 行数 车辆数 nodeNum
 * @param m 列数 配送点数 taskNum
 * @param defaultNum 默认值
 */

function initMatrix(n, m, defaultNum) {
    let matrix = [];
    for (let i = 0; i < n; ++i) {
        let matrix_i = [];
        for (let j = 0; j < m; ++j) {
            matrix_i.push(defaultNum);
        }
        matrix.push(matrix_i);
    }
    return matrix;
}

/**
 * 初始化信息素矩阵(全为1)
 * @param taskNum 任务数量
 * @param nodeNum 节点数量
 */
function initPheromoneMatrix(nodeNum, taskNum) {
    let pheromoneMatrix = [];
    for (let i = 0; i < nodeNum; ++i) {
        let pheromoneMatrix_i = [];
        for (let j = 0; j < taskNum; ++j) {
            pheromoneMatrix_i.push(1);
        }
        pheromoneMatrix.push(pheromoneMatrix_i);
    }
    return pheromoneMatrix;
}

// 初始化配送点集合矩阵  
async function initTaskArray(taskNum) {
    let randomArray = [];
    // 0 号为配送中心
    randomArray.push(0);
    for (let i = 1; i < taskNum; ++i) {
        // randomArray.push(random(range[0], range[1]));
        // Task.findById(i).getDataValue('demand');
        // console.log("findbyid:", Task.findById(i));
        let task = await Task.findOne({
            where: { id: i }
        });
        // console.log('task:id:' + task); 
        let temp = task.getDataValue('demand');
        // randomArray.push(task.getDataValue('demand'));
        randomArray.push(temp);
        // console.log('task:demand:' + temp);
        // randomArray.push(Task.findById(i).getDataValue('demand'));
    }

    // console.log('task' + randomArray);
    return randomArray;
}


// 初始化车辆 载重 集合矩阵
async function initLoadArray(length) {
    let randomArray = [];
    for (let i = 1; i <= length; ++i) {
        // 先找到 车辆 行
        let vehicle = await Vehicle.findOne({
            where: { id: i }
        });
        // 获取 车辆 类型编号
        let tempId = vehicle.getDataValue('typeId');
        console.log("typeId:" + tempId);
        let loadId = await VehicleType.findOne({
            where: { id: tempId }
        });
        let temp = loadId.getDataValue('load');
        randomArray.push(temp);
        // console.log('vehicle:load' + temp);
    }
    console.log('vehicle:load:' + randomArray);
    return randomArray;
}


// 初始化车辆类型 开销 集合矩阵
async function initCostArray(length) {
    let randomArray = [];
    for (let i = 1; i <= length; ++i) {
        // 先找到 车辆 行
        let vehicleId = await Vehicle.findOne({
            where: { id: i }
        });
        // 获取 车辆 类型编号
        let tempId = vehicleId.getDataValue('typeId');
        let costId = await VehicleType.findOne({
            where: { id: tempId }
        });
        let temp = costId.getDataValue('cost');
        randomArray.push(temp);
        console.log('vehicle:cost' + temp);
    }
    // console.log('cost' + randomArray);
    return randomArray;
}

/**
 * 初始化配送点间路径矩阵
 * @param n 列数 配送点数 taskNum
 */
async function initRouteMatrix(n) {

    // * @param n 行数 配送点数 taskNum
    let routeMatrix = initMatrix(n, n, 0);
    routeMatrix[0][0] = Number.MAX_VALUE;

    // 配送中心 到 配送点 之间到距离
    for (let taskCount = 1; taskCount < n; ++taskCount) {

        let task = await Task.findOne({
            where: { id: taskCount }
        });
        // console.log('task:id:' + task); 
        let x = task.getDataValue('xaxis');
        let y = task.getDataValue('yaxis');
        // const { tx } = Task.findById(taskCount).getDataValue('xaxis');
        // const { ty } = Task.findById(taskCount).getDataValue('yaxis');
        let t = x * x + y * y;
        routeMatrix[taskCount][0] = Math.sqrt(t);
        routeMatrix[0][taskCount] = routeMatrix[taskCount][0];

    }

    // 循环 配送点间的距离
    for (let taskCount = 1; taskCount < n; ++taskCount) {

        for (let rowCount = 1; rowCount <= taskCount; ++rowCount) {
            if (taskCount == rowCount) {
                routeMatrix[taskCount][rowCount] = Number.MAX_VALUE;
            }
            else {
                let taskone = await Task.findOne({
                    where: { id: taskCount }
                });
                let tasktwo = await Task.findOne({
                    where: { id: rowCount }
                });

                let tx = taskone.getDataValue('xaxis');
                let ty = taskone.getDataValue('yaxis');
                let rx = tasktwo.getDataValue('xaxis');
                let ry = tasktwo.getDataValue('yaxis');
                let t = (tx - rx) * (tx - rx) + (ty - ry) * (ty - ry);
                routeMatrix[taskCount][rowCount] = Math.sqrt(t);
                routeMatrix[rowCount][taskCount] = routeMatrix[taskCount][rowCount];
            }

        }

    }
    console.log('routeMatrix' + routeMatrix);
    return routeMatrix;
}



/**
 * 将第taskCount个任务分配给某一个车辆处理 
 * @param antCount 蚂蚁编号
 * @param taskCount 配送点编号
 * 
 * 
 */

function assignOneTask(antCount, taskCount, nodeNum, maxPheromoneMatrix, criticalPointMatrix) {

    // 若当前蚂蚁编号在临界点之前，则采用最大信息素的分配方式
    if (antCount <= criticalPointMatrix[taskCount]) {
        return maxPheromoneMatrix[taskCount];
    }

    // 若当前蚂蚁编号在临界点之后，则采用随机分配方式
    return random(0, nodeNum - 1);

}


/**
 * 计算一次迭代中，所有蚂蚁的成本 、满载率
 * @param pathMatrix_allAnt 所有蚂蚁的路径
 * 
 */
function calCost_oneIt(pathMatrix_allAnt, nodeNum, nodeMatrix, nodeCost) {
    let cost_allAnt = [];
    for (let antIndex = 0; antIndex < pathMatrix_allAnt.length; ++antIndex) {
        // 获取第antIndex只蚂蚁的行走路径
        let pathMatrix = pathMatrix_allAnt[antIndex];

        // 获取车辆开销
        let cost = 0;
        // 车辆
        for (let nodeIndex = 0; nodeIndex < nodeNum; ++nodeIndex) {
            let tempIndex = 0;
            for (let i = 0; i < pathMatrix[nodeIndex].length; ++i) {
                let j = pathMatrix[nodeIndex][i];
                cost += nodeCost[nodeIndex] * nodeMatrix[tempIndex][j];
                tempIndex = j;
            }
            cost += nodeCost[nodeIndex] * nodeMatrix[tempIndex][0];
        }

        cost_allAnt.push(cost);
    }
    return cost_allAnt;
}

/**
 * 计算一次迭代中，所有蚂蚁的 满载率 
 * @param pathMatrix_allAnt 所有蚂蚁的路径
 * @param tempNodes 车辆剩余装载量
 * @return: 
 */
function calLoadFactor_oneIt(pathMatrix_allAnt, tempNodes, nodes, nodeNum) {
    let loadFactor_allAnt = [];
    for (let antIndex = 0; antIndex < pathMatrix_allAnt.length; ++antIndex) {
        // 满载率 倒数
        let loadFactor = 0;
        for (let nodeIndex = 0; nodeIndex < nodeNum; ++nodeIndex) {
            // 计算节点taskIndex的满载率
            let load = nodes[nodeIndex] - tempNodes[nodeIndex];
            loadFactor = loadFactor + nodes[nodeIndex] / load;
        }

        loadFactor_allAnt.push(loadFactor);
    }
    return loadFactor_allAnt;
}

/**
 * 加权属性
 * @param
 * @param {type} 
 * @return: 
 */
function calWeight_oneIt(costArray_oneIt, loadFactorArray_oneIt) {
    let weight_allAnt = [];
    // antNum=10
    for (let antIndex = 0; antIndex < 10; ++antIndex) {

        // 对各属性加权比较
        let maxWeighting = -1;
        let maxCost = -1;
        let maxLoadFactor = -1;

        // 总开销最大值
        // antNum=10
        for (let i = 0; i < 10; ++i) {
            if (costArray_oneIt[i] > maxCost) {
                maxCost = costArray_oneIt[i];
            }
        }
        // 满载率倒数之和最大值
        // antNum=10
        for (let i = 0; i < 10; ++i) {
            if (loadFactorArray_oneIt[i] > maxLoadFactor) {
                maxLoadFactor = loadFactorArray_oneIt[i];
            }
        }

        // 找出加权后 最小的综合属性 开销+满载率倒数
        // antNum=10
        for (let antIndex = 0; antIndex < 10; antIndex++) {

            // 开销相对值
            let c = costArray_oneIt[antIndex] / maxCost;

            // 满载率相对值倒数
            let lf = loadFactorArray_oneIt[antIndex] / maxLoadFactor;

            let weight = (c + lf) / 2;

            if (weight > maxWeighting) {
                maxWeighting = weight;
                // minIndex = antIndex;
            }
        }
        weight_allAnt.push(maxWeighting);
    }
    return weight_allAnt;
}

/**
 * 更新信息素
 * @param pathMatrix_allAnt 本次迭代中所有蚂蚁的行走路径
 * @param pheromoneMatrix 信息素矩阵
 * @param weightArray_oneIt 本次迭代的加权的结果集
 */
function updatePheromoneMatrix(taskNum, nodeNum, pathMatrix_allAnt, pheromoneMatrix, weightArray_oneIt, maxPheromoneMatrix, criticalPointMatrix) {
    /** 每次迭代信息素衰减的比例 */
    let p = 0.5;

    /** 每次经过，信息素增加的比例 */
    let q = 2;

    // 所有信息素均衰减p%
    for (let i = 0; i < nodeNum; i++) {
        for (let j = 0; j < taskNum; j++) {
            pheromoneMatrix[i][j] *= p;
        }
    }

    // 找出加权属性最小的蚂蚁编号
    let minWeight = Number.MAX_VALUE;
    let minIndex = -1;
    // antNum=10
    for (let antIndex = 0; antIndex < 10; ++antIndex) {
        if (weightArray_oneIt[antIndex] < minWeight) {
            minWeight = weightArray_oneIt[antIndex];
            minIndex = antIndex;
        }
    }

    // 将本次迭代中最优路径的信息素增加q%
    for (let taskIndex = 0; taskIndex < taskNum; taskIndex++) {
        for (let nodeIndex = 0; nodeIndex < nodeNum; nodeIndex++) {
            if (pathMatrix_allAnt[minIndex][nodeIndex][taskIndex] == 1) {
                pheromoneMatrix[nodeIndex][taskIndex] *= q;
            }
        }
    }

    maxPheromoneMatrix = [];
    criticalPointMatrix = [];
    for (let nodeIndex = 1; nodeIndex < nodeNum; ++nodeIndex) {
        let maxPheromone = pheromoneMatrix[nodeNum - 1][0];
        let maxIndex = 0;
        let sumPheromone = pheromoneMatrix[nodeNum - 1][0];
        let isAllSame = true;
        // for (let taskIndex = 1; taskIndex < taskNum; ++taskIndex) {
        // let maxPheromone = pheromoneMatrix[0][taskNum];
        // let maxIndex = 0;
        // let sumPheromone = pheromoneMatrix[0][taskNum];
        // let isAllSame = true;

        // for (let nodeIndex = 0; nodeIndex < nodeNum; ++nodeIndex) {
        for (let taskIndex = 0; taskIndex < taskNum; ++taskIndex) {
            if (pheromoneMatrix[nodeIndex][taskIndex] > maxPheromone) {
                maxPheromone = pheromoneMatrix[nodeIndex][taskIndex];
                maxIndex = nodeIndex;
            }

            if (pheromoneMatrix[nodeIndex][taskIndex] != pheromoneMatrix[nodeIndex][taskIndex - 1]) {
                isAllSame = false;
            }

            sumPheromone += pheromoneMatrix[nodeIndex][taskIndex];
        }

        // 若本行信息素全都相等，则随机选择一个作为最大信息素
        if (isAllSame == true) {
            maxIndex = random(0, nodeNum - 1);
            maxPheromone = pheromoneMatrix[nodeIndex][maxIndex];
        }

        // 将本行最大信息素的下标加入maxPheromoneMatrix
        maxPheromoneMatrix.push(maxIndex);

        // antNum=10
        // 将本次迭代的蚂蚁临界编号加入criticalPointMatrix(该临界点之前的蚂蚁的任务分配根据最大信息素原则，而该临界点之后的蚂蚁采用随机分配策略)
        criticalPointMatrix.push(Math.round(10 * (maxPheromone / sumPheromone)));
    }

}

/**
 * 迭代搜索
 * @param iteratorNum 迭代次数 100
 * @param antNum 蚂蚁数量 10
 * @param taskNum 配送点数
 * @param nodeNum 车辆数
 * @param nodes 车辆(装载)集合
 * @param nodeMatrix 配送点距离矩阵
 */
function acaSearch(nodes, tasks, taskNum, nodeNum, nodeCost, nodeMatrix, pheromoneMatrix) {

    let path = [];
    let tempNodes = [];
    let maxPheromoneMatrix = [];
    let criticalPointMatrix = [];

    // 迭代循环    iteratorNum =100
    for (let itCount = 0; itCount < 100; ++itCount) {
        // 本次迭代中，所有蚂蚁的路径
        let pathMatrix_allAnt = [];

        // console.log("acasearch-nodes:" + nodes);
        for (let i = 0; i < nodeNum; ++i) {
            tempNodes[i] = nodes[i];
        }
        // console.log("tempNodes" + tempNodes);
        // antNum=10
        let select = random(1, 10);
        // console.log("选择的蚂蚁编号为" + select);

        let orderPath = [];

        // 蚂蚁循环    antNum=10
        for (let antCount = 0; antCount < 10; ++antCount) {
            // 第antCount只蚂蚁的分配策略(pathMatrix[i][j]表示第antCount只蚂蚁将 j 配送点分配给 i 车辆处理)
            let pathMatrix_oneAnt = initMatrix(nodeNum, taskNum, 0);

            orderPath = [];

            // 配送点循环
            for (let taskCount = 1; taskCount < taskNum; ++taskCount) {
                // 第antCount只蚂蚁将第taskCount个任务分配给第nodeCount个车辆处理
                let nodeCount = assignOneTask(antCount, taskCount, nodeNum, maxPheromoneMatrix, criticalPointMatrix);
                console.log("nodeCount:" + nodeCount);
                // console.log("tempNodes[nodeCount]:" + tempNodes[nodeCount]);
                // console.log("tasks[taskCount]" + tasks[taskCount]);
                // 若第nodeCount个车辆还能装载
                if (tempNodes[nodeCount] >= tasks[taskCount]) {
                    pathMatrix_oneAnt[nodeCount][taskCount] = 1;
                    tempNodes[nodeCount] -= tasks[taskCount];
                }

            }

            pathMatrix_allAnt.push(pathMatrix_oneAnt);  // [车辆][配送点]
            console.log("oneAnt:" + pathMatrix_oneAnt);
            console.log("allAnt:" + pathMatrix_allAnt);

            // 规划路径
            // 第 j 辆车
            for (let j = 0; j < nodeNum; ++j) {
                let tempIndex = 0;

                let minNodeIndex = 0; // 配送中心开始

                let tempPathMatrix = pathMatrix_oneAnt;

                let tempOrder = [];

                // 规划配送点配送顺序
                for (let i = 1; i < taskNum; ++i) {
                    let minlength = Number.MAX_VALUE;
                    // 对配送点距离进行比较 选最近的那个
                    for (let q = 1; q < taskNum; ++q) {
                        if (tempPathMatrix[j][q] == 1) {
                            if (nodeMatrix[minNodeIndex][q] < minlength) {
                                minlength = nodeMatrix[minNodeIndex][q];
                                tempIndex = q;
                            }
                        }
                    }//  q 循环结束
                    tempOrder.push(tempIndex);
                    minNodeIndex = tempIndex;
                    tempPathMatrix[j][minNodeIndex] = 0;

                }// i 循环

                orderPath.push(tempOrder);
                console.log("车辆 " + j + " 配送路径：" + orderPath);
            }//  j 循环

            // 最后一次循环 itCount=99
            if (select == antCount && itCount == 98) {
                path = orderPath;
                console.log("acasearch--path:" + path);
            }


            pathMatrix_allAnt.push(orderPath);  // [车辆][配送点]

            console.log("orderPath:" + orderPath);
            console.log("allAnt:" + pathMatrix_allAnt);
        }


        // 计算 本次迭代中 所有蚂蚁 的车辆满载率倒数
        let loadFactorArray_oneIt = calLoadFactor_oneIt(pathMatrix_allAnt, tempNodes, nodes, nodeNum);

        // 计算 本次迭代中 所有蚂蚁 的车辆开销
        let costArray_oneIt = calCost_oneIt(pathMatrix_allAnt, nodeNum, nodeMatrix, nodeCost);

        // 计算 本次迭代中 所有蚂蚁 的加权属性
        let weightArray_oneIt = calWeight_oneIt(costArray_oneIt, loadFactorArray_oneIt);
        // 将本地迭代中 所有蚂蚁的 加权属性加入总结果集
        // weightingResult.push(weightArray_oneIt);

        // 更新信息素
        updatePheromoneMatrix(taskNum, nodeNum, pathMatrix_allAnt, pheromoneMatrix, weightArray_oneIt, maxPheromoneMatrix, criticalPointMatrix);
    }

    return path;
}

/**
 * 蚁群算法
 */
function aca(tasks, taskNum, nodes, nodeNum, nodeMatrix, nodeCost) {

    let path = [];

    // 初始化信息素矩阵
    let pheromoneMatrix = initPheromoneMatrix(nodeNum, taskNum);
    console.log("pheromoneMatrix:" + pheromoneMatrix);

    // 迭代搜索
    path = acaSearch(nodes, tasks, taskNum, nodeNum, nodeCost, nodeMatrix, pheromoneMatrix);

    console.log("path:" + path);
    return path;

}


/**
 * 获取指定范围内的随机数
 * @param start 起点
 * @param end 终点
 * @returns {number}
 */
function random(start, end) {
    let length = end - start + 1;
    return Math.floor(Math.random() * length + start);
}

function routePlan(tasks, nodes, nodeCost, nodeMatrix, taskNum, nodeNum) {

    // //  初始化配送点合集
    // let tasks = initTaskArray(taskNum);

    // // 初始化车辆 载重 合集
    // let nodes = initLoadArray(nodeNum);

    // // 初始化车辆油耗合集
    // let nodeCost = initCostArray(nodeNum);

    // // 初始化配送点距离矩阵
    // let nodeMatrix = initRouteMatrix(taskNum);
    // // console.log(nodeMatrix);

    // 执行蚁群算法
    let path = aca(tasks, taskNum, nodes, nodeNum, nodeMatrix, nodeCost);

    return path;
}

// 查询
const getPath = async (ctx) => {
    let taskNum = await Task.count({});
    taskNum += 1;
    console.log('taskNum:' + taskNum);

    let nodeNum = await Vehicle.count({});
    console.log('nodeNum:' + nodeNum);

    //  初始化配送点合集
    let tasks = await initTaskArray(taskNum);

    // 初始化车辆 载重 合集
    let nodes = await initLoadArray(nodeNum);
    console.log("nodes" + nodes);

    // 初始化车辆油耗合集
    let nodeCost = await initCostArray(nodeNum);

    // 初始化配送点距离矩阵
    let nodeMatrix = await initRouteMatrix(taskNum);
    // console.log(nodeMatrix);

    const path = routePlan(tasks, nodes, nodeCost, nodeMatrix, taskNum, nodeNum);
    console.log('path:' + path);

    ctx.body = {
        data: path,
        // total,
        code: 1000,
        desc: 'success'
    }
}

module.exports = {
    getPath
};