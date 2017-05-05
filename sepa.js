/**
 * Sepa
 *
 * Version: 2.1.0
 * Author:  huanStephen
 * License: MIT
 * Date:    2017-1-12
 * Update:  2017-4-22
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

                subclass.prototype = Object.merge(subclass.prototype, parent.prototype);

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
                if(obj[i] instanceof Object && !(obj[i] instanceof Array) && !(obj[i] instanceof Function)) {
                    klass[i] = klass[i] ? Object.merge(klass[i], obj[i]) : obj[i];
                } else {
                    klass[i] = obj[i];
                }
            }
            extended && extended(klass);
        };

        klass.include = function(obj) {
            var included = obj.included;
            for(var i in obj) {
                if(obj[i] instanceof Object && !(obj[i] instanceof Array) && !(obj[i] instanceof Function)) {
                    klass.fn[i] = klass.fn[i] ? Object.merge(klass.fn[i], obj[i]) : obj[i];
                } else {
                    klass.fn[i] = obj[i];
                }
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
        //排序
        _sort : [],

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
            this._sort.splice(0, this._sort.length);
        },
        /**
         * 批量添加数据
         * @param array 数组格式数据
         */
        populate : function(array) {
            this.clear();

            var recode;
            for(var i = 0, il = array.length; i < il; i++) {
                recode = new this(array[i]);
                recode.save();
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
            var result = new Array();
            for(var i in this._sort) result.push(this._records[this._sort[i]]);
            return result;
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
            this._static._sort.push(this.id);
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
            this._static._count --;
            var sort = this._static._sort;
            for(var i=0; i < sort.length; i++) {
                if(sort[i] == this.id) {
                    this._static._sort.splice(i, 1);
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
                return this._static._component[packet][func].apply(this, paramArray);
            } catch (e) {
                throw('Component call error! \n' + e);
            }
        }
    });

    /**
     * Finite state machine
     * 有限状态机
     * @type {Function}
     * @private
     */
    var _StateMachine = org.eocencle.sepa.StateMachine = new _Class();

    _StateMachine.include({
        events : {},

        init : function(content) {
            this.content = content;
        },

        addEvent : function(event) {
            if(event && event.state && $.trim(event.state)) this.events[event.state] = event;
        },

        removeEvent : function(state) {
            delete this.events[state];
        },

        trigger : function(state) {
            this.events[state] && this.events[state].event.apply(this.content, arguments);
        }
    });

    /**
     * State machine event
     * 状态机事件
     * @type {Function}
     * @private
     */
    var _Event = org.eocencle.sepa.Event = new _Class();

    _Event.include({
        state : '',

        init : function(state, event) {
            this.state = state;
            this.event = event;
        },

        event : function() {}
    });

    /**
     * Remote call model
     * 远程调用模块
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _CRemote = org.eocencle.sepa.CRemote = new _Class();

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
    var _CElement = org.eocencle.sepa.CElement = new _Class();

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
    var _CVaildate = org.eocencle.sepa.CVaildate = new _Class();

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

    /**
     * Storage model
     * 本地存储模块
     * @type {org.eocencle.sepa.Class}
     * @private
     */
    var _CStorage = org.eocencle.sepa.CStorage = new _Class();

    _CStorage.extend({
        _component: {
            _common: {
                saveLocal : function(name, data) {
                    localStorage[name] = JSON.stringify(data);
                },

                loadLocal : function(name) {
                    var d = localStorage[name];
                    if(d == undefined) return d;
                    return JSON.parse(d);
                },

                removeLocal : function(name) {
                    localStorage.removeItem(name);
                },

                saveSession : function(name, data) {
                    sessionStorage[name] = JSON.stringify(data);
                },

                loadSession : function(name) {
                    var d = sessionStorage[name];
                    if(d == undefined) return d;
                    return JSON.parse(d);
                },

                removeSession : function(name) {
                    sessionStorage.removeItem(name);
                }
            }
        }
    });

})(jQuery);