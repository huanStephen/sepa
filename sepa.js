/**
 * Sepa
 *
 * Version: 2.0.0
 * Author:  huanStephen
 * Date:    2017-1-12
 * Remark:
 *  设计要点：
 *  1、命名空间，必要的情况下需要将三层命名空间划分开，避免命名冲突
 *  2、页面加载包含公开加载和内部加载，比如像网站的文章，属于公开在网站的，
 *      可以不用登录就可以直接输入地址访问的，这些页面的加载就是公开加载；像用户信息，
 *      只有用户登录之后才能加载的页面就是内部加载。公开加载需要把页面上的显示动作反应到URL里，
 *      以便非用户访问；内部加载只有在某些验证之后才可以加载，而不能直接访问，所以加载时避免URL改变。
 *  3、方便使用，尽量减少配置和函数，让使用更加简单。
 *  4、易于扩展，让用户追加插件容易，可以随时扩展框架。
 *  5、类的重用，将项目所有对象全部配置在一个文件，需要的时候进行继承，实例对象保存在继承后的实例里，
 *      避免一个页面同时使用相同实体造成对象覆盖或误清空。
 *  6、数据渲染，对每个结构都对应一种默认的渲染规则，也要保证可扩展性。
 *  7、结构和数据分离，html结构应该与js操作进行分离，使在js不变的情况下自由变换html结构，同样可以渲染。
 */
(function($) {

    var org = {eocencle : {sepa : {}}};

    /**
     * 深度合并对象
     * @param obj1  对象1
     * @param obj2  对象2
     */
    Object.merge = function(obj1, obj2) {

        if(!(obj1 instanceof Object)) throw('Obj1 is not an object!');
        if(!(obj2 instanceof Object)) throw('Obj2 is not an object!');

        var result = Object.assign(obj1 instanceof Function ? new _Class() : {}, obj1);
        for(var i in obj2) {
            if(obj2[i] instanceof Object) {
                if(!obj1[i] || !(obj1 instanceof Object)) {
                    result[i] = obj2[i];
                } else {
                    result[i] = Object.merge(obj1[i], obj2[i]);
                }
            } else {
                result[i] = obj2[i];
            }
        }

        return result;
    };

    /**
     * 基础类
     * @param parent    父类
     * @returns {klass} 返回类对象
     * @private
     */
    var _Class = org.eocencle.sepa.Class = function(parent) {

        var klass = function () {
            for(var i in this._initqueue)
                this._initqueue[i].apply(this, arguments);

            this.init && this.init.apply(this, arguments);
        };

        if(parent) {
            var subclass = function(){};
            var initqueue = new Array();

            if (parent instanceof Array) {
                var fn = {};

                for (var i in parent) {
                    klass = Object.merge(klass, parent[i]);

                    if(parent[i].fn.init) {
                        initqueue.push(parent[i].fn.init);
                        delete parent[i].fn.init;
                    }

                    fn = Object.merge(fn, parent[i].fn);
                }
                fn._initqueue = initqueue;

                subclass.prototype = fn;

                klass.prototype = new subclass;

                klass.prototype._static = klass;
            } else {
                klass = Object.merge(klass, parent);

                subclass.prototype._initqueue = initqueue;
                if(parent.prototype.init) {
                    subclass.prototype._initqueue.push(parent.prototype.init);
                    delete parent.prototype.init;
                }

                subclass.prototype = parent.prototype;

                klass.prototype = new subclass;

                klass.prototype._static = klass;
            }
        }

        klass.fn = klass.prototype;

        //添加静态方法
        klass.extend = function(obj) {
            var extended = obj.extended;
            for(var i in obj) {
                klass[i] = obj[i];
            }
            extended && extended(klass);
        };
        //添加实例方法
        klass.include = function(obj) {
            var included = obj.included;
            for(var i in obj) {
                klass.fn[i] = obj[i];
            }
            included && included(klass);
        };
        //代理
        klass.proxy = function(func) {
            var self = this;
            return (function() {
                return func.apply(self,arguments);
            });
        };

        klass.prototype.proxy = klass.proxy;

        return klass;
    };

    /**
     * 数据模型
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _BaseModel = org.eocencle.sepa.BaseMode = new _Class();

    _BaseModel.extend({
        //属性字段
        _attributes : [],
        //保存资源对象
        _records : {},
        //资源个数
        _count : 0,

        /**
         * 创建数据模型
         * @param attrArray 属性数组
         */
        create : function(attrArray) {
            var chkId = false;
            for(var i in attrArray) {
                if(attrArray[i] === 'id') {
                    chkId = true;
                    break;
                }
            }

            if(chkId) this._attributes = attrArray;
            else throw('Required id!');
        },
        /**
         * 查找记录
         * @param id    记录ID
         */
        find : function(id) {
            var result = this._records[id];
            if(!result) throw('Unkown record!');
            return result;
        },
        /**
         * 清空全部记录
         */
        clear : function() {
            this._records = {};
            this._count = 0;
        },
        /**
         * 批量添加数据
         * @param array 数组格式数据
         */
        populate : function(array) {
            this.clear();

            for(var i= 0, il = array.length; i < il; i++) {
                var recode = new _Model();
                recode._newRecord = false;
                recode.load(array[i]);

                this._records[recode.id] = recode;
                this._count ++;
            }
        },
        /**
         * 获取数据个数
         * @returns {number}    数据个数
         */
        count : function() {
            return this._count;
        },
        /**
         * 获取全部数据
         * @returns {_records|{}}   全部数据
         */
        all : function() {
            return this._records;
        }
    });

    /**
     * 实例模型
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _Model = org.eocencle.sepa.Model = new _Class();

    _Model.include({
        //是否新数据
        _newRecord : true,
        /**
         * 初始化数据模型
         * @param attributes    数据
         */
        init : function(attributes) {
            attributes && this.load(attributes);
        },
        /**
         * 加载数据
         * @param attributes    数据
         */
        load : function(attributes) {
            for (var name in attributes)
                this[name] = attributes[name];
        },
        /**
         * 创建记录
         */
        create : function() {
            this._newRecord = false;
            this._static._records[this.id] = this.dup();
            this._static._count ++;
        },
        /**
         * 更新记录
         */
        update : function() {
            this._static._records[this.id] = this.dup();
        },
        /**
         * 保存记录
         */
        save : function() {
            this._newRecord ? this.create() : this.update();
        },
        /**
         * 销毁记录
         */
        destroy : function() {
            delete this._static._records[this.id];
            this._static.count --;
        },
        /**
         * 获取属性对象
         * @returns 属性对象
         */
        attributes : function() {
            var result = {};
            for(var i in this._static._attributes) {
                var attr = this._static._attributes[i];
                result[attr] = this[attr];
            }
            result.id = this.id;
            return result;
        },
        /**
         * 转化为json
         * @returns {*|属性对象}
         */
        toJSON : function() {
            var obj = {};
            var attr = this._static._attributes;
            for(var i in attr)
                obj[attr[i]] = this[attr[i]];
            return JSON.stringify(obj);
        },
        /**
         * 将新纪录提交给服务器
         * @param url	请求地址
         * @param callback	回调函数
         */
        createRemote : function(url, callback) {
            $.post(url, this.attributes(), callback);
        },
        /**
         * 创建副本
         */
        dup : function() {
            return $.extend(true, {}, this);
        },
        /**
         * 保存到本地
         * @param name  保存名称
         */
        saveLocal : function(name){
            localStorage[name] = this.toJSON();
        },
        /**
         * 读取本地信息
         * @param name	保存名称
         */
        loadLocal : function(name){
            this.load(JSON.parse(localStorage[name] || '{}'));
        },
        /**
         * 删除本地信息
         * @param name  保存名称
         */
        removeLocal : function(name) {
            localStorage.removeItem(name);
        }
    });



})(jQuery);