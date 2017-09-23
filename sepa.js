/**
 * Sepa
 *
 * Version: 3.0.0
 * Author:  huanStephen
 * License: MIT
 * Date:    2017-1-12
 * Update:  2017-9-24
 */
(function($) {

    this.org = {eocencle : {sepa : {}}};

    /**
     * Guid generator
     * guid生成
     * @returns {string}
     */
    Math.guid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    };

    /**
     * Base class
     * 基础类
     * @param parent    父类
     * @returns {klass} 返回类对象
     * @private
     */
    var _Class = org.eocencle.sepa.Class = function(parent) {

        var klass = function() {
            var inits = new Array;
            var args = arguments;
            var curr = this;
            do {
                inits.push(curr.init);
            } while(curr = curr._super);

            inits.reverse();
            inits.forEach(this.proxy(function(val, idx, arr) {
                val.apply(this, args);
            }));
        };

        klass.prototype.init = function() {};

        klass.prototype.super = function(func, args) {
            if (this._super) {
                if (this._super[func]) {
                    return this._super[func].apply(this, args);
                } else {
                    return this._super.super(func, args);
                }
            } else {
                throw ReferenceError('Function of ' + func + ' is not found!');
            }
        };

        klass._merge = function(obj1, obj2) {
            if (!obj1) {
                return obj2;
            }

            if (typeof obj1 != typeof obj2) {
                throw TypeError('Merge object types are inconsistent!\n#obj1=' + typeof obj1 + ',#obj2=' +
                    typeof obj2);
            }

            if (obj2 instanceof Function || obj2 instanceof Array) {
                return obj2;
            }

            if (obj2 instanceof Object) {
                var result = Object.assign({}, obj1);
                for (var i in obj2) {
                    if (obj2[i] instanceof Object) {
                        result[i] = klass._merge(obj1[i], obj2[i]);
                    } else {
                        result[i] = obj2[i];
                    }
                }
                return result;
            }
            return obj2;
        };

        if (parent) {
            if (parent instanceof Array) {
                var classes = new Array;
                var sup = null;
                parent.forEach(function(val, idx, arr) {
                    var cls = new Array;
                    sup = val;
                    do {
                        cls.push(sup.fn._class);
                    } while (sup = sup._super);
                    cls.reverse();
                    classes = classes.concat(cls);
                });

                var first = true;
                classes.forEach(function(val, idx, arr) {
                    if (first) {
                        sup = new _Class(val);
                        first = false;
                    } else {
                        sup.extend(val);
                        sup.include({
                            init : val.prototype.init
                        });
                        sup.include(val.prototype);
                        sup = new _Class(sup);
                    }
                });

                parent = sup;
            }

            for (var i in parent) {
                klass[i] = klass._merge(klass[i], parent[i]);
            }
            for (var i in parent.prototype) {
                klass.prototype[i] = klass._merge(klass.prototype[i], parent.prototype[i]);
            }
            klass._super = parent;
            klass.prototype._super = parent.prototype;
        }

        klass.fn = klass.prototype;

        klass.extend = function(obj) {
            var extended = obj.extended;
            for(var i in obj){
                klass[i] = klass._merge(klass[i], obj[i]);
            }
            if (extended) {
                extended(klass);
            }
        };

        klass.include = function(obj) {
            var included = obj.included;
            for(var i in obj){
                klass.fn[i] = klass._merge(klass.fn[i], obj[i]);
            }
            if (included) {
                included(klass);
            }
        };

        klass.proxy = function(func) {
            var self = this;
            return (function() {
                return func.apply(self, arguments);
            });
        }
        klass.fn.proxy = klass.proxy;

        klass.fn._class = klass;

        Object.defineProperty(klass, '_merge', {enumerable : false});
        Object.defineProperty(klass, '_super', {enumerable : false});
        Object.defineProperty(klass, 'extend', {enumerable : false});
        Object.defineProperty(klass, 'include', {enumerable : false});
        Object.defineProperty(klass, 'proxy', {enumerable : false});
        Object.defineProperty(klass, 'fn', {enumerable : false});
        Object.defineProperty(klass.prototype, '_class', {enumerable : false});
        Object.defineProperty(klass.prototype, '_super', {enumerable : false});
        Object.defineProperty(klass.prototype, 'init', {enumerable : false});
        Object.defineProperty(klass.prototype, 'super', {enumerable : false});
        Object.defineProperty(klass.prototype, 'proxy', {enumerable : false});

        return klass;
    };

    /**
    * Finite state machine
    * 有限状态机
    * @type {Function}
    * @private
    */
    var _StateMachine = org.eocencle.sepa.StateMachine = new _Class;

    _StateMachine.include({

        on : function(name, callback) {
            if (!name || !callback) {
                return;
            }
            if (!this._handlers) {
                this._handlers = {};
            }
            if (!this._handlers[name]) {
                this._handlers[name] = [];
            }
            this._handlers[name].push(callback);
        },

        trigger : function(name) {
            if (!this._handlers) {
                return;
            }

            var args = $.makeArray(arguments);
            var name = args.shift();

            var callbacks = this._handlers[name];
            if (!callbacks) {
                return;
            }

            callbacks.forEach(this.proxy(function(val, idx, arr) {
                val.apply(this, args);
            }));
        },

        delEvent : function(name) {
            if (this._handlers[name]) {
                delete this._handlers[name];
            }
        },

        setup : function(nameArr) {
            if (nameArr instanceof Array) {
                nameArr.forEach(this.proxy(function(val, idx, arr) {
                    this[val] = function() {
                        var args = $.makeArray(arguments);
                        if ('function' == typeof args[0]) {
                            args.unshift(val);
                            this.on.apply(this, args);
                        } else if ('delete' == args[0]) {
                            this.delEvent.call(this, val);
                        } else {
                            args.unshift(val);
                            this.trigger.apply(this, args);
                        }
                    }
                }));
            }
        }
    });

    /**
     * Data model
     * 数据模型
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _BaseModel = org.eocencle.sepa.BaseModel = new _Class;

    _BaseModel.extend({
        //属性字段
        _attributes : [],
        //保存资源对象
        _records : {},
        //排序
        _sort : [],

        /**
         * 创建数据模型
         * @param attrArray 属性数组
         */
        create : function(attrArray) {
            var chkId = false;
            attrArray.forEach(function(val, idx, arr) {
                if(val === 'id') {
                    chkId = true;
                }
            });

            if (chkId) {
                this._attributes = attrArray;
            } else {
                throw('Required id!');
            }
        },
        /**
         * 查找记录
         * @param id    记录ID
         */
        find : function(id) {
            var result = this._records[id];
            if (!result) {
                throw('Unkown record!');
            }
            return result;
        },
        /**
         * 清空全部记录
         */
        clear : function() {
            this._records = {};
            this._sort.splice(0, this._sort.length);
        },
        /**
         * 批量添加数据
         * @param array 数组格式数据
         */
        populate : function(array) {
            this.clear();

            var recode;
            for (var i = 0, il = array.length; i < il; i++) {
                recode = new this(array[i]);
                recode.save();
            }
        },
        /**
         * 获取数据个数
         * @returns {number}    数据个数
         */
        count : function() {
            return this.all().length;
        },
        /**
         * 获取全部数据
         * @returns {_records|{}}   全部数据
         */
        all : function() {
            var result = new Array;
            this._sort.forEach(this.proxy(function(val, idx, arr) {
                result.push(this._records[val]);
            }));
            return result;
        },
        /**
         *  遍历数据
         * @param callback  回调函数
         */
        each : function(callback) {
            for (var i in this._sort) {
                callback.call(this, this._records[this._sort[i]], this._sort[i], this._records);
            }
        }
    });

    /**
     * Data entity model
     * 实例模型
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _Model = org.eocencle.sepa.Model = new _Class;

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
            this._class._records[this.id] = this.dup();
            this._class._sort.push(this.id);
        },
        /**
         * 更新记录
         */
        update : function() {
            this._class._records[this.id] = this.dup();
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
            delete this._class._records[this.id];
            var sort = this._class._sort;
            for (var i = 0; i < sort.length; i++) {
                if(sort[i] == this.id) {
                    this._class._sort.splice(i, 1);
                    break;
                }
            }
        },
        /**
         * 获取属性对象
         * @returns 属性对象
         */
        attributes : function() {
            var result = {};
            this._class._attributes.forEach(this.proxy(function(val, idx, arr) {
                result[val] = this[val];
            }));
            result.id = this.id;
            return result;
        },
        /**
         * 转化为json
         * @returns {*|属性对象}
         */
        toJSON : function() {
            var obj = {};
            this._class._attributes.forEach(this.proxy(function(val, idx, arr) {
                obj[val] = this[val];
            }));
            return JSON.stringify(obj);
        },
        /**
         * 将新纪录提交给服务器
         * @param url	请求地址
         * @param callback	回调函数
         */
        createRemote : function(url, callback) {
            // 防止400错误
            var params = this.attributes();
            for (var i in params) {
                if (!params[i]) {
                    delete params[i];
                }
            }
            $.post(url, params, callback);
        },
        /**
         * 创建副本
         */
        dup : function() {
            var result = new this._class(this);
            result._newRecord = this._newRecord;
            return result;
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
        },
        /**
         * 保存到会话
         * @param name  保存名称
         */
        saveSession : function(name) {
            sessionStorage[name] = this.toJSON();
        },
        /**
         * 读取会话信息
         * @param name  保存名称
         */
        loadSession : function(name) {
            this.load(JSON.parse(sessionStorage[name] || '{}'));
        },
        /**
         * 删除会话信息
         * @param name  保存名称
         */
        removeSession : function(name) {
            sessionStorage.removeItem(name);
        }
    });

    /**
     * Control class
     * 控制类
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _Controller = org.eocencle.sepa.Controller = new _Class;

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
            this.searchGlobals();
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
                    this._el.on(eventName, selector, method);
                }
            }
        },

        refreshElements : function() {
            for(var key in this.elements)
                this[this.elements[key]] = this.$(key);
        },

        searchGlobals : function() {
            for(var key in this.globals)
                this[this.globals[key]] = $(key);
        },

        pickBlocks : function() {
            for(var key in this.blocks)
                this[this.blocks[key]] = this.$(this[key]()).clone();
        },

        component : function(func, paramArray, packet) {
            if(!packet || !$.trim(packet)) packet = '_common';

            try {
                return this._class._component[packet][func].apply(this, paramArray);
            } catch (e) {
                throw('Component call error! \n' + e);
            }
        }
    });

    /**
     * Remote call model
     * 远程调用模块
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _CRemote = org.eocencle.sepa.CRemote = new _Class;

    _CRemote.extend({
        _component : {
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
                            $.get(config.path, config.params,
                                config.callback instanceof Function ? config.callback : this.proxy(this[config.callback]),
                                'json');
                        } else {
                            $.get(config.path,
                                config.callback instanceof Function ? config.callback : this.proxy(this[config.callback]),
                                'json');
                        }
                    } else {
                        if(config.params && $.trim(config.params)) {
                            $.post(config.path, config.params,
                                config.callback instanceof Function ? config.callback : this.proxy(this[config.callback]),
                                'json');
                        } else {
                            $.post(config.path,
                                config.callback instanceof Function ? config.callback : this.proxy(this[config.callback]),
                                'json');
                        }
                    }
                }
            }
        }
    });

    /**
     * Element model
     * 元素模块
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _CElement = org.eocencle.sepa.CElement = new _Class;

    _CElement.extend({
        _component : {
            _common : {
                element : function(elName) {
                    var defEl = {
                        h1 : '<h1></h1>',
                        h2 : '<h2></h2>',
                        h3 : '<h3></h3>',
                        h4 : '<h4></h4>',
                        h5 : '<h5></h5>',
                        h6 : '<h6></h6>',
                        b : '<b></b>',
                        strong : '<strong></strong>',
                        i : '<i></i>',
                        em : '<em></em>',
                        dfn : '<dfn></dfn>',
                        hr : '<hr/>',
                        br : '<br/>',
                        nobr : '<nobr></nobr>',
                        p : '<p></p>',
                        base : '<base/>',
                        a : '<a></a>',
                        img : '<img/>',
                        bgsound : '<bgsound></bgsound>',
                        table : '<table></table>',
                        tr : '<tr></tr>',
                        td : '<td></td>',
                        thead : '<thead></thead>',
                        tbody : '<tbody></tbody>',
                        tfoot : '<tfoot></tfoot>',
                        input : '<input/>',
                        select : '<select></select>',
                        optgroup : '<optgroup></optgroup>',
                        option : '<option></option>',
                        textarea : '<textarea></textarea>',
                        span : '<span></span>',
                        button : '<button></button>',
                        div : '<div></div>',
                        ul : '<ul></ul>',
                        ol : '<ol></ol>',
                        li : '<li></li>',
                        label : '<label></label>'
                    };

                    if(elName && $.trim(elName)) {
                        if(defEl[elName])
                            return $(defEl[elName]);
                    } else {
                        throw('Invalid elements!');
                    }
                }
            }
        }
    });

    /**
     * Vaildate model
     * 验证模块
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _CVaildate = org.eocencle.sepa.CVaildate = new _Class;

    _CVaildate.extend({
        _component : {
            _common: {
                vaildate : function() {
                    var defMsg = {
                        required : '此字段必填！',
                        email : '请输入有效的邮箱地址！',
                        url : '请输入有效的URL！',
                        date : '请输入有效的日期！',
                        dateISO : '请输入有效的日期(ISO)！',
                        number : '请输入有效的数字！',
                        digits : '请输入整数！',
                        equalTo : '请输入相同的值！',
                        maxlength : '输入超出设置长度！',
                        minlength : '输入不够设置长度！',
                        rangelength : '输入长度超出范围！',
                        range : '输入值超出范围！',
                        max : '输入值不能大于设置值！',
                        min : '输入值不能小于设置值！',
                        effective : '有效数据只能包含英文、数字、下划线！',
                        remote : '异步验证失败！'
                    };

                    var rule = $.trim(arguments[0]);
                    var errMsg = arguments[1];
                    var params = Array.prototype.slice.call(arguments,2);
                    if(rule && defMsg[rule]) {
                        if (rule === 'remote' ? this.component('chkRemote', params)
                                : this.component(rule, params)) {
                            return '';
                        } else {
                            if (!errMsg || !$.trim(errMsg)) {
                                return defMsg[rule];
                            } else {
                                return errMsg;
                            }
                        }
                    } else {
                        throw('Invalid rules!');
                    }
                },

                bind : function(name, path) {
                    var cfgName = '_chk' + name;

                    var config = {
                        path : '',
                        method : 'get',
                        params : {},
                        callback : '',
                        check : 0
                    };

                    config.path = path;
                    config.callback = this.proxy(function(data) {
                        if(data.result) this.config[cfgName].check = 1;
                    });

                    this.config[cfgName] = config;

                    var func = this.proxy(function(name, $el) {
                        var cfgName = '_chk' + name;
                        var cfg = this.config[cfgName];

                        if(!cfg) throw('No configuration!');

                        cfg.check = 0;
                        cfg.params[name] = $el.val();

                        this.component('remote', [cfgName]);
                    });

                    return func;
                },

                required: function(value) {
                    if (!value || !$.trim(value))
                        return false;
                    return true;
                },
                email: function(value) {
                    var chk = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
                    return chk.test(value);
                },
                url: function(value) {
                    var chk = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
                    return chk.test(value);
                },
                date: function (value) {
                    var chk = /Invalid|NaN/;
                    return !chk.test(new Date(value).toString());
                },
                dateISO: function (value) {
                    var chk = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/;
                    return chk.test(value);
                },
                number: function (value) {
                    var chk = /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/;
                    return chk.test(value);
                },
                digits: function (value) {
                    var chk = /^\d+$/;
                    return chk.test(value);
                },
                equalTo: function (compare, value) {
                    return $.trim(compare) === $.trim(value);
                },
                maxlength: function (maxlen, value) {
                    var max;
                    try {
                        max = parseInt(maxlen);
                    } catch (e) {
                        throw('maxlength:类型转换错误！');
                    }
                    return value.length <= maxlen;
                },
                minlength: function (minlen, value) {
                    var min;
                    try {
                        min = parseInt(minlen);
                    } catch (e) {
                        throw('minlength:类型转换错误！');
                    }
                    return minlen <= value.length;
                },
                rangelength: function (rangelen, value) {
                    var min, max;
                    var sp = rangelen.split('~');
                    try {
                        min = parseInt(sp[0]);
                        max = parseInt(sp[1]);
                    } catch (e) {
                        throw('rangelength:类型转换错误！');
                    }
                    return min <= value.length && value.length <= max;
                },
                range: function (range, value) {
                    var min, max, val;
                    var sp = range.split('~');
                    try {
                        min = parseInt(sp[0]);
                        max = parseInt(sp[1]);
                        val = parseInt(value);
                    } catch (e) {
                        throw('range:类型转换错误！');
                    }
                    return min <= val && val <= max;
                },
                max: function (max, value) {
                    var m, v;
                    try {
                        m = parseInt(max);
                        v = parseInt(value);
                    } catch (e) {
                        throw('max:类型转换错误！');
                    }
                    return v < m;
                },
                min: function (min, value) {
                    var m, v;
                    try {
                        m = parseInt(min);
                        v = parseInt(value);
                    } catch (e) {
                        throw('min:类型转换错误！');
                    }
                    return m < v;
                },
                effective: function (value) {
                    var chk = /^\w+$/;
                    return chk.test(value);
                },
                chkRemote: function (name) {
                    if (this.config['_chk' + name].check) return true;
                    else return false;
                }
            }
        }
    });

})(jQuery);