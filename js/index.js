$(function () {
    var canvas1;    // 底层静态画布
    var canvas2;    // 浮层路径画布
    var context1;   // 底层画布canvas对象
    var context2;   // 浮层画布canvas对象
    var axis = [];    // 道路数组
    var node = [];    // 道路交点数组
    var posNum = 0;    // 定位点计数
    var endNode = [];    // 离终点最近的交点数组
    var pos = [];    // 起点终点数组
    var house = [];    // 房间数组
    var path = [];    // 路径数组
    var bestPath = [];    // 最有路径数组

    // 获取鼠标点击坐标
    var getMousePos = function (event) {
        var e = event || window.event;
        var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
        var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
        var x = e.pageX || e.clientX + scrollX;
        var y = e.pageY || e.clientY + scrollY;
        return {
            x: x,
            y: y
        };
    };

    // 根据道路计算交点
    var calNode = function () {
        for (var i = 0; i < axis.length - 1; i++) {
            for (var j = i + 1; j < axis.length; j++) {
                var a = {
                    x: axis[i][0],
                    y: axis[i][1]
                };
                var b = {
                    x: axis[i][2],
                    y: axis[i][3]
                };
                var c = {
                    x: axis[j][0],
                    y: axis[j][1]
                };
                var d = {
                    x: axis[j][2],
                    y: axis[j][3]
                };
                var segments = calSegments(a, b, c, d);
                if (segments) {
                    node.push([segments.x, segments.y, [i, j]]);
                }
            }
        }
    };

    // 线段交点计算方法
    var calSegments = function (a, b, c, d) {
        var denominator = (b.y - a.y) * (d.x - c.x) - (a.x - b.x) * (c.y - d.y);
        if (denominator === 0) {
            return false;
        }
        var x = ((b.x - a.x) * (d.x - c.x) * (c.y - a.y) + (b.y - a.y) * (d.x - c.x) * a.x - (d.y - c.y) * (b.x - a.x) * c.x) / denominator;
        var y = -((b.y - a.y) * (d.y - c.y) * (c.x - a.x) + (b.x - a.x) * (d.y - c.y) * a.y - (d.x - c.x) * (b.y - a.y) * c.y) / denominator;
        if ((x - a.x) * (x - b.x) <= 0 && (y - a.y) * (y - b.y) <= 0 && (x - c.x) * (x - d.x) <= 0 && (y - c.y) * (y - d.y) <= 0) {
            return {
                x :  x,
                y :  y
            };
        }
        return false;
    };

    // 交点维度递归寻路
    var calPath = function (start, step) {
        var begin = [];
        for (var i = 0; i < start[2].length; i++) {
            for (var j = 0; j < node.length; j++) {
                if (node[j][2].indexOf(start[2][i]) >= 0 && begin.indexOf(node[j]) < 0) {
                    begin.push(node[j]);
                }
            }
        }
        for (var i = 0; i < begin.length; i++) {
            var stepIn = step.concat();
            var isRepeat = 0;
            for (var j = 0; j < step.length; j++) {
                if (step[j][0] === begin[i][0] && step[j][1] === begin[i][1] && j > 2) {
                    isRepeat = 1;
                }
            }
            var isArrival = 0;
            for (var j = 0; j < endNode.length; j++) {
                if (endNode[j][0] === begin[i][0] && endNode[j][1] === begin[i][1]) {
                    isArrival = 1;
                }
            }
            if (isRepeat === 0) {
                stepIn.push([begin[i][0], begin[i][1]]);
                if (isArrival === 1) {
                    path.push(stepIn);
                }
                else {
                    calPath(begin[i], stepIn);
                }
            }
        }
    };

    // 判断定位点是否在屋内
    var isIndoor = function (x, y) {
        var indoor = [[x, y]];
        for (var i = 0; i < house.length; i++) {
            if (x > house[i][0] && x < house[i][2] && y > house[i][1] && y < house[i][3]) {
                indoor = house[i][4];
            }
        }
        return indoor;
    };

    // 获取指定点最近的交点
    var getNode = function (x, y) {
        var minDisArr = [];
        for (var i = 0; i < axis.length; i++) {
            if (axis[i][0] === axis[i][2]) {
                minDisArr.push(x - axis[i][0] < 0 ? axis[i][0] - x : x - axis[i][0]);
            }
            else {
                minDisArr.push(y - axis[i][1] < 0 ? axis[i][1] - y : y - axis[i][1]);
            }
        }
        var minDis = Math.min.apply(null, minDisArr);
        var minIndex = minDisArr.indexOf(minDis);
        var result = [];
        if (axis[minIndex][0] === axis[minIndex][2]) {
            result = [axis[minIndex][0], y, [minIndex]];
        }
        else {
            result = [x, axis[minIndex][1], [minIndex]];
        }
        return result;
    };

    // 获取最合适的门
    var calDoor = function () {
        var startDoor = isIndoor(pos[0], pos[1]);
        var endDoor = isIndoor(pos[2], pos[3]);
        path = [];
        var end;
        var start;
        if (startDoor === endDoor) {
            path.push([[pos[0], pos[1]], [pos[2], pos[3]]]);
        }
        else {
            for (var k = 0; k < endDoor.length; k++) {
                endNode = [];
                node = [];
                calNode();
                end = getNode(endDoor[k][0], endDoor[k][1]);
                node.push(end);
                for (var i = 0; i < end[2].length; i++) {
                    for (var j = 0; j < node.length; j++) {
                        if (node[j][2].indexOf(end[2][i]) >= 0 && endNode.indexOf(node[j]) < 0) {
                            endNode.push(node[j]);
                        }
                    }
                }
                for (var i = 0; i < startDoor.length; i++) {
                    start = getNode(startDoor[i][0], startDoor[i][1]);
                    var step = [
                        [pos[0], pos[1]],
                        [startDoor[i][0], startDoor[i][1]],
                        [start[0], start[1]]
                    ];
                    calPath(start, step);
                }
                for (var i = 0; i < path.length; i++) {
                    if (path[i][path[i].length - 1][0] !== pos[2] && path[i][path[i].length - 1][1] !== pos[3]) {
                        path[i].push([end[0], end[1]]);
                        path[i].push([endDoor[k][0], endDoor[k][1]]);
                        path[i].push([pos[2], pos[3]]);
                    }
                }
            }
        }
        drawPath();
    };

    // 绘制最短路径
    var drawPath = function () {
        var disarray = [];
        for (var i = 0; i < path.length; i++) {
            var distance = 0;
            for (var j = 0; j < path[i].length - 1; j++) {
                var xdis = (path[i][j + 1][0] - path[i][j][0]) * (path[i][j + 1][0] - path[i][j][0]);
                var ydis = (path[i][j + 1][1] - path[i][j][1]) * (path[i][j + 1][1] - path[i][j][1]);
                distance += Math.sqrt(xdis + ydis);
            }
            disarray.push(distance);
        }
        var minDis = Math.min.apply(null, disarray);
        var minIndex = disarray.indexOf(minDis);
        bestPath = path[minIndex];
        if (minIndex >= 0) {
            context2.beginPath();
            context2.lineWidth = '2';
            for (var i = 0; i < path[minIndex].length; i++) {
                context2.lineTo(path[minIndex][i][0], path[minIndex][i][1]);
            }
            context2.stroke();
            context2.closePath();
            context2.lineWidth = '1';
        }
    };

    // 绘制房屋
    var drawHouse = function (x1, y1, x2, y2, text, door) {
        context1.beginPath();
        context1.moveTo(x1, y1);
        context1.lineTo(x2, y1);
        context1.lineTo(x2, y2);
        context1.lineTo(x1, y2);
        context1.lineTo(x1, y1);
        context1.fillStyle = '#EEECDB';  //fillStyle设置或返回用于填充绘画的颜色、渐变或模式
        context1.fill();
        context1.stroke();
        context1.closePath();
        context1.beginPath();
        context1.fillStyle = '#000';
        context1.strokeStyle = 'blue';
        context1.lineWidth = '2';
        var doorCoord = [];
        for (var i = 0; i < door.length; i++) {
            switch (door[i]) {
                case 0:
                    context1.moveTo((x2 - x1) / 2 + x1 - 10, y1);
                    context1.lineTo((x2 - x1) / 2 + x1 + 10, y1);
                    doorCoord.push([(x2 - x1) / 2 + x1, y1]);
                    break;
                case 1:
                    context1.moveTo(x2, (y2 - y1) / 2 + y1 - 10);
                    context1.lineTo(x2, (y2 - y1) / 2 + y1 + 10);
                    doorCoord.push([x2, (y2 - y1) / 2 + y1]);
                    break;
                case 2:
                    context1.moveTo((x2 - x1) / 2 + x1 - 10, y2);
                    context1.lineTo((x2 - x1) / 2 + x1 + 10, y2);
                    doorCoord.push([(x2 - x1) / 2 + x1, y2]);
                    break;
                case 3:
                    context1.moveTo(x1, (y2 - y1) / 2 + y1 - 10);
                    context1.lineTo(x1, (y2 - y1) / 2 + y1 + 10);
                    doorCoord.push([x1, (y2 - y1) / 2 + y1]);
                    break;
            }
        }
        context1.stroke();
        context1.closePath();
        context1.strokeStyle = '#333';
        context1.lineWidth = '1';
        context1.fillText(text, (x2 - x1) / 2 + x1, (y2 - y1) / 2 + y1);
        house.push([x1, y1, x2, y2, doorCoord]);
    };

    // 绘制起点终点
    var drawPos = function (x, y) {
        if (posNum !== 1) {
            context2.clearRect(0, 0, 1000, 500);
            var imageStart = new Image();
            imageStart.src = '../img/position-start.png';
            imageStart.onload = function () {
                context2.drawImage(imageStart, x - 8.5, y - 24);
            };
            posNum = 1;
            pos = [x, y];
        }
        else if (posNum === 1) {
            var imageEnd = new Image();
            imageEnd.src = '../img/position-end.png';
            imageEnd.onload = function () {
                context2.drawImage(imageEnd, x - 8.5, y - 24);
            };
            posNum = 2;
            pos.push(x);
            pos.push(y);
            calDoor();
        }
    };

    // 绘制道路
    var drawAxis = function () {
        for (var i = 0; i < axis.length; i++) {
            context1.beginPath();
            context1.strokeStyle = 'green';  //strokeStyle设置或返回用于笔触的颜色、渐变或模式
            context1.moveTo(axis[i][0], axis[i][1]);
            context1.lineTo(axis[i][2], axis[i][3]);
            context1.stroke();
            context1.closePath();
            context1.strokeStyle = '#333';  
        }
    };

    // 初始化底层画布
    var draw = function () {
        drawHouse(0, 0, 160.5, 100.5, '701', [1]);
        drawHouse(0, 100.5, 160.5, 200.5, '702', [1]);
        drawHouse(0, 200.5, 160.5, 300.5, '703', [1]);
        drawHouse(0, 300.5, 160.5, 350.5, '楼梯', [2]);
        drawHouse(0, 399.5, 160.5, 499.5, '704', [0, 1]);
        drawHouse(200.5, 0, 360.5, 100.5, '705', [2, 3]);
        drawHouse(360.5, 0, 520.5, 100.5, '706', [2]);
        drawHouse(520.5, 0, 680.5, 100.5, '707', [2]);
        drawHouse(680.5, 0, 840.5, 100.5, '708', [2]);
        drawHouse(840.5, 0, 999.5, 100.5, '709', [2]);
        drawHouse(200.5, 150.5, 360.5, 250.5, '710', [0, 3]);
        drawHouse(360.5, 150.5, 520.5, 250.5, '711', [0]);
        drawHouse(520.5, 150.5, 680.5, 250.5, '712', [0]);
        drawHouse(840.5, 150.5, 999.5, 250.5, '713', [0]);
        drawHouse(680.5, 150.5, 740.5, 250.5, '电梯1', [1]);
        drawHouse(780.5, 150.5, 840.5, 250.5, '电梯2', [3]);
        drawHouse(200.5, 250.5, 360.5, 350.5, '718', [2, 3]);
        drawHouse(360.5, 250.5, 520.5, 350.5, '719', [2]);
        drawHouse(520.5, 250.5, 680.5, 350.5, '720', [2]);
        drawHouse(840.5, 250.5, 999.5, 350.5, '721', [2]);
        drawHouse(680.5, 250.5, 740.5, 350.5, '电梯3', [1]);
        drawHouse(780.5, 250.5, 840.5, 350.5, '电梯4', [3]);
        drawHouse(200.5, 399.5, 360.5, 499.5, '714', [0, 3]);
        drawHouse(360.5, 399.5, 520.5, 499.5, '715', [0]);
        drawHouse(520.5, 399.5, 680.5, 499.5, '716', [0]);
        drawHouse(680.5, 399.5, 840.5, 499.5, '717', [0]);
        drawHouse(840.5, 399.5, 999.5, 499.5, '卫生间', [0]);
        axis = [
            [180.5, 0, 180.5, 500],
            [180.5, 125.5, 1000, 125.5],
            [0, 375.5, 1000, 375.5],
            [760.5, 125.5, 760.5, 375.5]
        ];
        drawAxis();
    };

    // 初始化canvas和img对象
    var initCanvas = function () {
        canvas1 = $('#map')[0];
        context1 = canvas1.getContext('2d');
        context1.strokeStyle = '#333';
        context1.fillStyle = '#333';
        context1.textAlign = 'center';
        context1.textBaseline = 'middle';
        context1.font = "normal 14px sans-serif";
        canvas2 = $('#path')[0];
        context2 = canvas2.getContext('2d');
        context2.strokeStyle = 'red';
        context2.fillStyle = 'red';
        context2.textAlign = 'center';
        context2.textBaseline = 'middle';
        context2.font = "normal 14px sans-serif";
        draw();
    };

    // 事件监听
    var bind = function () {
        $('.container').on('click', function (e) {
            var x = parseInt(getMousePos(e).x - $(this).offset().left, 10);
            var y = parseInt(getMousePos(e).y - $(this).offset().top, 10);
            drawPos(x, y);
        });
        $('.go').on('click', function () {
            console.log(bestPath);
            if (bestPath.length > 0) {
                var i = 0;
                var interval = window.setInterval(function () {
                    drawPos(bestPath[0][0] + i, bestPath[0][1] + i);
                    drawPos(bestPath[bestPath.length - 1][0], bestPath[bestPath.length - 1][1]);
                    i = i + 1;
                }, 500);
            }
        });
    };

    // 入口函数
    var init = function () {
        initCanvas();
        bind();
    };

    // 初始化
    init();
});

