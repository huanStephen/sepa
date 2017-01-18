/**
 * Sepa
 *
 * Version: 2.0.0
 * Author:  huanStephen
 * License: GPL-3.0
 * Date:    2017-1-12
 * Update:  2017-1-18
 */
(function($) {

    this.org = {eocencle : {sepa : {}}};

    /**
     * The depth of the merger object
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
     * Base class
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

                    if(parent[i].fn._initqueue)
                        initqueue = initqueue.concat(parent[i].fn._initqueue);
                    if(parent[i].fn.init)
                        initqueue.push(parent[i].fn.init);

                    fn = Object.merge(fn, parent[i].fn);
                }
                fn._initqueue = initqueue;

                subclass.prototype = fn;
            } else {
                klass = Object.merge(klass, parent);

                if(parent.prototype._initqueue)
                    initqueue.concat(parent.prototype._initqueue);
                if(parent.prototype.init)
                    initqueue.push(parent.prototype.init);

                subclass.prototype = parent.prototype;

                subclass.prototype._initqueue = initqueue;
            }

            klass.prototype = new subclass;

            klass.prototype._static = klass;
        }

        klass.prototype.init = function() {};

        klass.fn = klass.prototype;

        klass.extend = function(obj) {
            var extended = obj.extended;
            for(var i in obj) {
                klass[i] = obj[i];
            }
            extended && extended(klass);
        };

        klass.include = function(obj) {
            var included = obj.included;
            for(var i in obj) {
                klass.fn[i] = obj[i];
            }
            included && included(klass);
        };

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
     * Data model
     * 数据模型
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _BaseModel = org.eocencle.sepa.BaseModel = new _Class();

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

            var Base = new _Class(_BaseModel);
            Base.create(this._attributes);
            var Recode = new _Class([Base, _Model]);
            for(var i = 0, il = array.length; i < il; i++) {
                var recode = new Recode(array[i]);
                recode.save();
            }
            this._records = Recode.all();
            this._count = Recode.count();
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
     * Data entity model
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
        saveLocal : function(name) {
            localStorage[name] = this.toJSON();
        },
        /**
         * 读取本地信息
         * @param name	保存名称
         */
        loadLocal : function(name) {
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

    /**
     * Control class
     * 控制类
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _Controller = org.eocencle.sepa.Controller = new _Class();

    _Controller.extend({
        //扩展组件
        _component : {}
    });

    _Controller.include({
        //配置
        config : {},

        init : function(element) {
            this._el = $(element);
            this.refreshElements();
            this.delegateEvents();
            this.pickBlocks();
            this.load && this.load();
        },

        $ : function(selector) {
            return $(selector, this._el);
        },
        //根据第一个空格来分隔
        eventSplitter : /^(\w+)\s*(.*)$/,

        delegateEvents: function() {
            for(var key in this.events) {
                var methodName = this.events[key];
                var method = this.proxy(this[methodName]);
                var match = key.match(this.eventSplitter);
                if(match == undefined) throw(this.events[key] + ' Bind error!');
                var eventName = match[1];
                var selector = match[2];
                if(selector === '') {
                    this._el.bind(eventName, method);
                } else {
                    if(selector.substring(0,1) === '#') {
                        this.$(selector).bind(eventName, method);
                    } else {
                        this._el.delegate(selector, eventName, method);
                    }
                }
            }
        },

        refreshElements : function() {
            for(var key in this.elements)
                this[this.elements[key]] = this.$(key);
        },

        pickBlocks : function() {
            for(var key in this.blocks)
                this[this.blocks[key]] = this.$(this[key]()).clone();
        },

        component : function(func, paramArray, packet) {
            if(!packet || !$.trim(packet)) packet = '_common';

            try {
                return this._static.component[packet][func].apply(this, paramArray);
            } catch (e) {
                throw('Component call error!');
            }
        }
    });

    /**
     * 远程调用模块
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _CRemote = org.eocencle.sepa.CRemote = new _Class();

    _CRemote.extend({
        component : {
            _common : {
                remote : function(cfgName) {
                    var defcfg = {
                        path : '',
                        method : 'get',
                        params : {},
                        callback : ''
                    };

                    if(!$.trim(cfgName)) throw('No configuration!');

                    var cfg = this.config[cfgName];
                    if(!cfg) throw('No configuration!');

                    if(!cfg.path || !$.trim(cfg.path)) throw('Required path!');
                    if(!cfg.callback || !$.trim(cfg.callback)) throw('Required callback!');

                    var config = Object.assign(defcfg, cfg);

                    if(!config.method || !$.trim(config.method) ||
                        $.trim(config.method).toLocaleLowerCase() === 'get') {
                        if(config.params && $.trim(config.params)) {
                            $.get(config.path, config.params, this[config.callback]);
                        } else {
                            $.get(config.path, this[config.callback]);
                        }
                    } else {
                        if(config.params && $.trim(config.params)) {
                            $.post(config.path, config.params, this[config.callback]);
                        } else {
                            $.post(config.path, this[config.callback]);
                        }
                    }
                }
            }
        }
    });

})(jQuery);