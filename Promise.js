/**
 * 自定义 Promise 函数模块
 * 
 */

/** ES5 */
// ES5 怎么写模块: 匿名函数自调用 英文： IIFE

(function (window) {
    /**
     * Promise 的构造函数
     * excutor:执行器函数（同步执行）
     */

    const PENDING = 'pending'
    const RESOLVED = 'resolved'
    const REJECTED = 'rejected'

    function Promise(excutor) {
        const self = this
        self.status = PENDING // 给 Promise 对象指定 status 属性，初始值为 pending
        self.data = undefined // 给 Promise 对象指定一个用于存储结果数据的属性
        self.callbacks = [] // 每个元素的结构：{onResolved(){},onRejected(){}}


        function resolve(value) {
            // 状态不是 pending 直接结束
            if (self.status !== PENDING) return;

            // 将状态改为 resolved
            self.status = 'resolved'

            // 保存 value 数据
            self.data = value

            // 如果有待执行callbacks函数，立即异步执行回调函数 onResolved
            if (self.callbacks.length > 0) {
                setTimeout(() => { //放到队列中执行所有成功的回调
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onResolved(value)
                    });
                }); //同 0
            }

        }

        function reject(reason) {
            if (self.status !== PENDING) return;

            // 将状态改为 rejected
            self.status = 'rejected'

            // 保存 reason 数据
            self.data = reason


            // 如果有待执行callbacks函数，立即异步执行回调函数 onRejected
            if (self.callbacks.length > 0) {
                setTimeout(() => { //放到队列中执行的回调
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onRejected(reason)
                    });
                }); //同 0
            }

        }

        // 立即同步执行 excutor
        try {
            excutor(resolve, reject)
        } catch (error) { // 如果执行器抛出异常，Promise 对象变成 rejected
            reject(error)
        }
    }


    /**
     *  Promise 原型对象的 then() 
     *  指定成功和失败的回调函数
     *  返回一个新的 Promise 对象
     * */
    Promise.prototype.then = function (onResolved, onRejected) {
        // 假设当前状态还是 pending 状态，将回调函数保存起来

        onResolved = typeof onResolved === 'function' ? onResolved  : value => value  // 向下传递成功的 value
        // 指定默认失败的回调(实现错误/异常传透的关键点)
        onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw reason} // throw 前不能有return
        // 向后传递失败的 reason

        const self = this


        // 返回一个新的 Promise 对象
        return new Promise((resolve, reject) => {

        /**调用指定回调函数，根据执行结果，改变 return 的 Promise 状态 */
        function handler(callback) {
            /**
             * 1. 如果抛出异常，return 的 Promise 就会失败，reason 就是 error
             * 2. 如果回调函数返回不是 Promise  return 的 Promise 就会成功，value 就是返回的值
             * 3. 如果回调函数返回是 Promise ,return 的 Promise 结果就是这个 Promise 的结果
             */
            try {
                const result = callback(self.data)
                if (result instanceof Promise) {
                    // result.then(
                    //     value => resolve(value), // 当 result 成功时，让 return 的 Promise 也成功
                    //     reason => reject(reason) // 当 result 失败时，让 return 的 Promise 也失败
                    //     )
                    resolve.then(resolve, reject)
                } else {
                    resolve(result)
                }
            } catch (error) {
                reject(error)
            }
        }

            if (self.status === PENDING) {
                self.callbacks.push({
                    onResolved(value) { // 28 集
                        handler(onResolved)
                    },
                    onRejected(reason) {
                        handler(onRejected)
                    }
                })
            } else if (self.status === RESOLVED) { // 如果当前是 resolved 状态，异步执行 onResolved 并改变 return 的 Promise 状态
                setTimeout(() => {
                    handler(onResolved)
                });
            } else { // 'rejected'
                setTimeout(() => {
                    handler(onRejected)
                });
            }
        })

    }

    /** 
     * Promise 原型对象的 catch() 
     * 指定失败的回调函数
     * 返回一个新的 Promise 对象
     * */
    Promise.prototype.catch = function (onRejected) {
        return this.then(undefined,onRejected)
    }

    /**
     *  Promise 函数对象的 resolved()
     * 返回指定结果，的一个成功的 Promise 对象
     *  */
    Promise.resolved = function (value) {
        // 返回一个成功/失败的 Promise
        return new Promise ((resolve,reject) => {
            // value 是 Promise
            if (value instanceof Promise) { // 使用 value 的结果作为 Promise 的结果
                value.then(resolve,reject)
            // value 不是 Promise => Promise 变成成功 数据是 value
            }else{
                resolve(value)
            }
        })

    }

    /** 
     * Promise 函数对象的 reject() 
     * 返回指定结果，的一个失败的 Promise 对象
     * */
    Promise.rejected = function (reason) {
        // 返回一个失败的 Promise
        return new Promise((resolve,reject) => {
            reject(reason)
        })

    }

    /**
     *  Promise 函数对象的 all()
     *  返回一个 Promise 只有当所有 Promise 都成功时才成功，否则失败
     * */
    Promise.all = function (promises) {

        const values = new  Array(promises.length) // 

        let resolveCount = 0 

        return new Promise((resolve,reject) =>{
            promises.forEach((p,index)=>{
                Promise.resolve(p).then(
                    value => {
                        resolveCount++
                        values[index] = value

                        if (resolve === promises.length) {
                            resolve(values)
                        }
                    },
                    reason => {
                        reject(reason)
                    }
                )
            })

        })

    }

    /** 
     * Promise 函数对象的 race()
     * 返回一个 Promise 其结果由第一个完成的 Promise 决定
     * */
    Promise.race = function (promises) {
        return new Promise ((resolve,reject) =>{
            promises.forEach((p,index)=>{
                Promise.resolve(p).then(
                    value => {
                        resolve(value)
                    },
                    reason => {
                        reject(reason)
                    }
                )
            })
        })

    }


    // 向外暴露 Promise 函数
    window.Promise = Promise
})(window);















/** ES6 */