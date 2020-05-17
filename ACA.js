const Task = require('./models/task')
const Vehicle = require('./models/vehicle')
const VehicleType = require('./models/vehicleType')
const Op = require('sequelize').Op

/** 迭代次数 */
let iteratorNum = 100;
/** 蚂蚁的数量 */
let antNum = 10;

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
 * 将第taskCount个任务分配给某一个车辆处理 
 * @param antCount 蚂蚁编号
 * @param taskCount 配送点编号
 * 
 * 
 */

function assignOneTask(antCount, taskCount, maxPheromoneMatrix, criticalPointMatrix) {

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
    // for (let nodeIndex = 1; nodeIndex < nodeNum; ++nodeIndex) {
    for (let taskIndex = 1; taskIndex < taskNum; ++taskIndex) {
        let maxPheromone = pheromoneMatrix[0][taskNum];
        let maxIndex = 0;
        let sumPheromone = pheromoneMatrix[0][taskNum];
        let isAllSame = true;

        for (let nodeIndex = 0; nodeIndex < nodeNum; ++nodeIndex) {
            // for (let taskIndex = 0; taskIndex < taskNum; ++taskIndex) {
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

        for (let i = 0; i < nodeNum; ++i) {
            tempNodes[i] = nodes[i];
        }

        // antNum=10
        let select = random(0, 10);

        // 蚂蚁循环    antNum=10
        for (let antCount = 0; antCount < 10; ++antCount) {
            // 第antCount只蚂蚁的分配策略(pathMatrix[i][j]表示第antCount只蚂蚁将 j 配送点分配给 i 车辆处理)
            let pathMatrix_oneAnt = initMatrix(nodeNum, taskNum, 0);

            let orderPath = [];

            // 配送点循环
            for (let taskCount = 1; taskCount < taskNum; ++taskCount) {
                // 第antCount只蚂蚁将第taskCount个任务分配给第nodeCount个车辆处理
                let nodeCount = assignOneTask(antCount, taskCount, maxPheromoneMatrix, criticalPointMatrix);
                // 若第nodeCount个车辆还能装载
                if (tempNodes[nodeCount] >= tasks[taskCount]) {
                    pathMatrix_oneAnt[nodeCount][taskCount] = 1;
                    tempNodes[nodeCount] -= tasks[taskCount];
                }
            }

            // 规划路径
            // 第 j 辆车
            for (let j = 0; j < nodeNum; ++j) {
                let tempIndex = 0;

                let minNodeIndex = 0; // 配送中心开始

                let tempPathMatrix = pathMatrix_oneAnt;

                let tempOrder = [];

                for (let i = 1; i < taskNum; ++i) {
                    let minlength = Number.MAX_VALUE;
                    // 对配送点距离进行比较 选最近的那个
                    for (let q = 1; q < taskNum; ++q) {
                        if (tempPathMatrix[j][q] == 1) {
                            if (routeMatrix[minNodeIndex][q] < minlength) {
                                minlength = routeMatrix[minNodeIndex][q];
                                tempIndex = q;
                            }
                        }
                    }//  q 循环结束
                    tempOrder.push(tempIndex);
                    minNodeIndex = tempIndex;
                    tempPathMatrix[j][minNodeIndex] = 0;
                }// i 循环

                orderPath.push(tempOrder);
            }//  j 循环

            // 最后一次循环 itCount=99
            if (select == antCount && itCount == 99) {
                path = orderPath;
            }

            pathMatrix_allAnt.push(orderPath);  // [车辆][配送点]

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

    // 迭代搜索
    path = acaSearch(nodes, tasks, taskNum, nodeNum, nodeCost, nodeMatrix, pheromoneMatrix);

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

/**
 * 创建随机数组
 * @param length 数组长度
 * @param range 数组取值范围
 */
function initRandomArray(length, range) {
    let randomArray = [];
    for (let i = 0; i < length; ++i) {
        randomArray.push(random(range[0], range[1]));
    }
    return randomArray;
}




// ACA内
function init(tasks, nodes, nodeCost, nodeMatrix, taskNum, nodeNum) {

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
module.exports = { init }


/** 配送点数量*/ ///////////count
// let taskNum = 100;
// 车辆数量 
// let nodeNum = 10;
// /** 配送点需求量取值范围*/ 吨
// let taskLengthRange = [0.5, 1];
// /** 车辆装载能力取值范围 */   吨
// let nodeSpeendRange = [10, 40];
// /** 车辆运行成本取值范围*/
// let nodeCostRange = [5, 7];
// /** 配送点间距离范围*/
// let nodeLengthRange = [10, 30];
/** 配送点集合 （task[i]表示第i个配送点的配送量 */
// let tasks = [];
// task条目数
// let taskNum = Task.count();
/**  运送车辆集合(nodes[i]表示第i个车辆的装载量) */
// let nodes = [];
// node/vehicle条目数
// let nodeNum = Vehicle.count();
/** 车辆已装载货物量 */  //放到循环里定义也可以
// let tempNodes = [];
/** 车辆运行成本 */
// let nodeCost = [];
/** 配送点距离矩阵*/
// let nodeMatrix = [];
/** 信息素矩阵(记录每条路径上当前信息素含量，初始状态下均为0) */
// let pheromoneMatrix = [];
/** 最大信息素的下标矩阵(存储当前信息素矩阵中每行最大信息素的下标) */
// let maxPheromoneMatrix = [];
// /** 一次迭代中，随机分配的蚂蚁临界编号(该临界点之前的蚂蚁采用最大信息素下标，而该临界点之后的蚂蚁采用随机分配) */
// let criticalPointMatrix = [];
// /** 配送路线开销结果集([迭代次数][蚂蚁编号]) */
// let resultCostData = [];
// /** 配送路线车辆满载率结果集([迭代次数][蚂蚁编号]) */
// let resultLoadFactorData = [];
// /** 加权后结果集([迭代次数][蚂蚁编号]）*/ ////第i次迭代中第j个蚂蚁第加权结果集
// let weightingResult = [];
// /** 每次迭代信息素衰减的比例 */
// let p = 0.5;
// /** 每次经过，信息素增加的比例 */
// let q = 2;



