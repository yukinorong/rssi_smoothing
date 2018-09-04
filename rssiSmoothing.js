testRssi1 = [32,40,45,40,42,41,39,37,50,34] // 平均值40 方差24
testRssi2 = [30,54,34,36,40,56,32,42,36,40] // 平均值40 方差68.8
testRssi3 = [10,19,27,41,52,55,75,80,85,105] // 逐增数据

// 求平均值
var average = function(arr){
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
        sum += arr[i];
    };
    return sum/arr.length
}

// 求方差
var variance = function(numbers) {
    var mean = 0;
    var sum = 0;
    for(var i=0;i<numbers.length;i++){
        sum += numbers[i];
    }
    mean = sum / numbers.length;
    sum = 0;
    for(var i=0;i<numbers.length;i++){
        sum += Math.pow(numbers[i] - mean , 2);
    }
    return sum / numbers.length;
};

//队列实现  递推滤波数据结构
function Queue(){
        this.dataStore = [];
        this.enqueue = enqueue;
        this.dequeue = dequeue;
        this.front = front;
        this.back = back;
        this.toString = toString;
        this.isEmpty = isEmpty;
        this.count = count;
}

function enqueue(element) {
	this.dataStore.push(element);
}

function dequeue() {
	return this.dataStore.shift();
}

function front() {
	return this.dataStore[0]
}

function back() {
	return this.dataStore[this.dataStore.length-1];
}

function toString() {
	var retStr = ""
	for (var i=0; i<this.dataStore.length; ++i) {
		retStr += this.dataStore[i] + " "
	}
	return retStr
}

function isEmpty() {
	if(this.dataStore.length == 0){
        return true;
    }else{
        return false;
    } 
}

function count(){
    return this.dataStore.length;
}

// 将数组转换为队列 队列长度为5
var setQueue = function(arr,q,length=5) {
	arr.forEach(function(value) {
		q.enqueue(value)
		if(q.count() >= length+1){
			q.dequeue()
		}
	})
}

// 排序算法中的比较函数 用法 array.sort(compare)
var compare = function (x, y) { //排序结果，从小到大
	if (x.distance < y.distance) {
	return -1;
	} else if (x.distance > y.distance) {
	return 1;
	} else {
	return 0;
	}
}

////////////////////////////////////////////////////////////////////////
///////////////////滤波优化函数
////////////////////////////////////////////////////////////////////////

// 均值滤波
var avgSmoothing = function(arr) {
	var sum = 0;
    for (var i = 0; i < arr.length; i++) {
        sum += arr[i];
    };
    return sum/arr.length
}
console.log("均值滤波: ")
console.log("testRssi1 : ",avgSmoothing(testRssi1))
console.log("testRssi2 : ",avgSmoothing(testRssi2))


// 递推平均滤波  队列 + 均值滤波  队列长度5（基于数据量决定）
var q1 = new Queue()
var q2 = new Queue()

setQueue(testRssi1,q1)
setQueue(testRssi2,q2)

// var recurSmoothing = avgSmoothing

console.log("递推平均滤波: ")
console.log("testRssi1 : ",avgSmoothing(q1.dataStore))
console.log("testRssi2 : ",avgSmoothing(q2.dataStore))

//中位值滤波 队列 + 求中位数

var medianSmoothing = function(q) {
	var arr = q.dataStore
	arr.sort(compare)
	if(q.count()%2 === 0){
		return (arr[q.count()/2] + arr[q.count()/2-1])/2
	}
	else {
		return arr[(q.count()-1)/2]
	}
}

console.log("中位值滤波: ")
console.log("testRssi1 : ",medianSmoothing(q1))
console.log("testRssi2 : ",medianSmoothing(q2))


//狄克逊检验法滤波  狄克逊检验异常值 + 均值滤波 

var dixonCheck = function(array){
	var arr = array
	var len = arr.length
	var d = 0.530  //临界值 查表
	// 根据样本长度，选择检验值 a b 大小
	if(len>=3 && len<=7){
		var a = 1
		var b = 1
	}else if(len>=8&&len<=10){
		var a = 1
		var b = 2
	}
	else if(len>=11&&len<=13){
		var a = 2
		var b = 2
	}else{
		var a = 2
		var b = 3
	}
	// 检验高端异常值
	var rh = (arr[len-1]-arr[len-1-a])/(arr[len-1]-arr[b-1])
	// 检验低端异常值
	var rl = (arr[a]-arr[0])/(arr[len-b]-arr[0])

	if(rh > rl && rh > d){
		var newarr = arr.slice(0,len-1)
		return dixonCheck(newarr)
	}else if(rl > rh && rl > d){
		var newarr = arr.slice(1,len)
		return dixonCheck(newarr)
	}else{
		return arr
	}
}

console.log("狄克逊检验法滤波: ")
console.log("testRssi1 : ",avgSmoothing(dixonCheck(testRssi1)))
console.log("testRssi2 : ",avgSmoothing(dixonCheck(testRssi2)))

// 高斯滤波 选择rssi值在高斯区间内部的数据。  然后利用均值滤波求解。
var gaussianSmooting = function(array) {
	var arr = array
	var avg = average(arr)
	var v = variance(arr)
	var newarr = new Array()
	arr.forEach(function(value){
		if(value <= avg + v && value >= avg - v){
			newarr.push(value)
		}
	})
	return avgSmoothing(newarr)
}

console.log("高斯滤波: ")
console.log("testRssi1 : ",gaussianSmooting(testRssi1))
console.log("testRssi2 : ",gaussianSmooting(testRssi2))

// 速度常量滤波 a,b 为增益常量；TS 为采样时间间隔 单位ms

var len1 = testRssi1.length
var len2 = testRssi2.length
var velocitySmoothing = function(Rpred,Rprev,a = 0.8,b = 0.1,ts = 200,Vpred = 0) {
	var Rest = Rpred + a * (Rprev - Rpred)
	var Vest = Vpred + b/ts*(Rprev - Rpred)
	var newRpred = Rest + Vest * ts
	var newVpred = Vest
	return newRpred
}
console.log("速度常量滤波: ")
console.log("testRssi1 : ",velocitySmoothing(testRssi1[len1-2],testRssi1[len1-1]))
console.log("testRssi2 : ",velocitySmoothing(testRssi2[len2-2],testRssi2[len2-1]))


// 卡尔曼滤波 （只用来拟合静态数据，效果非常好，不适合拟合动态数据。）

var prevData=0, p=10, q=0.0001, r=0.005, kGain=0;
var kalmanSmoothing = function(inData) {
	p = p+q; 
	kGain = p/(p+r);

	inData = prevData+(kGain*(inData-prevData)); 
	p = (1-kGain)*p;

	prevData = inData;

	return inData; 
}
var newarr1 = new Array()
testRssi1.forEach(function(value) {
	newarr1.push(kalmanSmoothing(value))
})
var newarr2 = new Array()
testRssi2.forEach(function(value) {
	newarr2.push(kalmanSmoothing(value))
})
console.log("卡尔曼滤波: 显著减少数据波动")
console.log("testRssi1 : ",newarr1,"方差为：",variance(newarr1))
console.log("testRssi2 : ",newarr2,"方差为(在训练完testRssi1之后的状态下)：",variance(newarr2))



