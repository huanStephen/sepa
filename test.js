/**
 * 基础类测试
 */
(function() {

    var sepa = org.eocencle.sepa;

    var Animal = new sepa.Class;

    Animal.include({
        init : function() {
            console.log('Animal init');
        },
        eat : function() {
            console.log('Animal eat');
        },

        run : function() {
            console.log('Animal run');
        }
    });

    var Reptile = new sepa.Class(Animal);

    Reptile.include({
        a : {
            b : {
                c : 'OK'
            }
        },

        init : function() {
            console.log('Reptile init');
        },
        eat : function() {
            console.log('Reptile eat');
        },

        run : function() {
            console.log('Reptile run');
        }
    });

    var Tortoies = new sepa.Class(Reptile);

    Tortoies.include({
        a : {
            d : 'YES'
        },

        init : function() {
            console.log('Tortoies init');
            this.run();
        },
        run : function() {
            console.log('Tortoies run');
            this.super('run');
        }
    });

    var tortoies = new Tortoies;
    console.log(tortoies.a.b.c);
    console.log(tortoies.a.d);
    tortoies.eat();

    var Fish = new sepa.Class(Animal);

    Fish.include({
        init : function() {
            console.log('Fish init');
        },
        run : function() {
            console.log('Fish swim');
        }
    });

    var Fly = new sepa.Class;

    Fly.include({
        init : function() {
            console.log('Fly init');
        },
        fly : function() {
            console.log('fly');
        }
    });

    var FlyFish = new sepa.Class([Fly, Fish]);

    var flyFish = new FlyFish;
    flyFish.fly();
})();

(function() {
    var sepa = org.eocencle.sepa;

    var Model = new sepa.Class(sepa.StateMachine);

    Model.extend({
        records:    {},
        attributes: [],
        isModel:    true,

        // records is an object, since we want
        // to be able to use non-integer ids
        recordsValues: function(){
            var result = [];
            for (var key in this.records)
                result.push(this.records[key]);
            return result;
        },

        setup: function(name){
            var result = new sepa.Class(Model);
            // Can't use .name, so we use .className
            result.className = name;
            return result;
        },

        rawFind: function(id){
            var record = this.records[id];
            if( !record ) throw(this.className + ": Unknown Record #" + id);
            return record;
        },

        findByAttribute: function(name, value){
            for(var key in this.records){
                if(this.records[key][name] == value){
                    return this.records[key].dup();
                }
            }
        },

        find: function(id){
            var record = this.rawFind(id);
            return(record.dup());
        },

        exists: function(id){
            try {
                return this.find(id);
            } catch (e) {
                return false;
            }
        },

        all: function(){
            return this.dupArray(this.recordsValues());
        },

        first: function(){
            var record = this.recordsValues()[0];
            return(record && record.dup());
        },

        last: function(){
            var values = this.recordsValues();
            var record = values[values.length - 1];
            return(record && record.dup());
        },

        select: function(callback){
            var result = [];
            for(var key in this.records){
                if(callback(this.records[key]))
                    result.push(this.records[key]);
            }
            return this.dupArray(result);
        },

        each: function(callback){
            for(var key in this.records) {
                callback(this.records[key]);
            }
        },

        count: function(){
            return this.recordsValues().length;
        },

        deleteAll: function(){
            for(var key in this.records){
                delete this.records[key];
            }
        },

        destroyAll: function(){
            for(var key in this.records){
                this.records[key].destroy();
            }
        },

        update: function(id, atts){
            this.find(id).updateAttributes(atts);
        },

        create: function(atts){
            var record = new this(atts);
            record.save();
            return record;
        },

        destroy: function(id){
            this.find(id).destroy();
        },

        populate: function(values){
            this.records = [];
            for (var i=0, il = values.length; i < il; i++) {
                var record = new this(values[i])
                record.newRecord = false;
                this.records[record.id] = record;
            }
            this.trigger("populate");
        },

        fromArray: function(array){
            var result = [];
            for (var i in array)
                result[i] = new this(array[i]);
            return result;
        },

        dupArray: function(array){
            return jQuery.each(array, function(i, item){
                return(item && item.dup());
            });
        }
    });

    Model.include({
        init: function(atts){
            this.newRecord = true;
            this.load(atts);
            this.reloadChanges();
        },

        isNew: function(){
            return this.newRecord;
        },

        save: function(){
            this.trigger("beforeSave");
            this.isNew() ? this.create() : this.update();
            this.trigger("afterSave");
            this.trigger("save");
        },

        load: function(attributes){
            for(var name in attributes){
                this[name] = attributes[name];
            }
        },

        updateAttribute: function(name, value){
            this[name] = value;
            return this.save();
        },

        updateAttributes: function(attributes){
            this.load(attributes);
            return this.save();
        },

        dup: function(){
            var result = new this._class(this.attributes());
            result.newRecord = this.newRecord;
            return result;
        },

        attributes: function(){
            var result = {};
            for(var i in this._class.attributes) {
                var attr = this._class.attributes[i];
                result[attr] = this[attr];
            }
            result.id = this.id;
            return result;
        },

        changes: function(){
            var result = {};
            var atts   = this.attributes();
            var patts  = this.previousAttributes;
            for (var key in atts) {
                if (atts[key] != patts[key])
                    result[key] = [patts[key], atts[key]];
            }
            return result;
        },

        // Private

        trigger: function(name){
            this._super.trigger(name, this);
        },

        reloadChanges: function(){
            this.previousChanges    = (this.previousAttributes ? this.changes() : {});
            this.previousAttributes = this.attributes();
        },

        generateID: function(){
            var last   = this._class.last();
            var lastId = last ? last.id : 0;
            return(lastId += 1);
        },

        rawDestroy: function(){
            delete this._class.records[this.id];
        },

        destroy: function(){
            this.trigger("beforeDestroy");
            this.rawDestroy();
            this.trigger("afterDestroy");
            this.trigger("destroy");
        },

        rawCreate: function(){
            if( !this.id ) return;
            this._class.records[this.id] = this.dup();
        },

        create: function(){
            this.trigger("beforeCreate");
            if( !this.id ) this.id = this.generateID();
            this.newRecord = false;
            this.rawCreate();
            this.reloadChanges();
            this.trigger("afterCreate");
            this.trigger("create");
            return this.id;
        },

        rawUpdate: function(){
            var item = this._class.rawFind(this.id);
            item.load(this.attributes());
        },

        update: function(){
            this.trigger("beforeUpdate");
            this.rawUpdate();
            this.reloadChanges();
            this.trigger("afterUpdate");
            this.trigger("update");
            return true;
        }
    });

// Setters and Getters

    Model.setters = function(obj){
        for(var key in obj)
            this.__defineSetter__(key, obj[key]);
    };
    Model.fn.setters = Model.setters;

    Model.getters = function(obj){
        for(var key in obj)
            this.__defineGetter__(key, obj[key]);
    };
    Model.fn.getters = Model.getters;

// Serialization

    Model.serializeRecords = function(){
        var result = {};
        for(var key in this.records)
            result[key] = this.records[key].attributes();
        return result;
    };

    var UserModel = Model.setup('User');
    var user = UserModel.create(['id', 'name', 'age', 'sex', 'hobby']);
    user.load({name : '李四', age : 20, sex : false, hobby : '排球'});
    var id = user.save();

})();


(function() {
    var sepa = org.eocencle.sepa;

    var UserInfo = new sepa.Class(sepa.BaseModel);
    UserInfo.create(['id', 'name', 'age', 'sex', 'hobby']);

    var UserEntity = new sepa.Class([UserInfo, sepa.Model]);

    var user1 = new UserEntity();
    user1.id = 1;
    user1.name = '张三';
    user1.age = 18;
    user1.sex = true;
    user1.hobby = '足球';
    user1.save();

    var user2 = new UserEntity({id : 2, name : '李四', age : 20, sex : false, hobby : '排球'});
    user2.save();

    var user3 = new UserEntity();
    user3.load({id : 3, name : '王五', age : 25, sex : true, hobby : '篮球'});
    user3.save();

    var u = UserEntity.find(1);
    $('.find').children('span').text(u.id + '--' + u.name + '--' + u.age + '--' + u.sex + '--' + u.hobby);

    UserEntity.clear();
    $('.clear').children('span').text(UserEntity.count());

    UserEntity.populate([
        {id : 1, name : '张三', age : 18, sex : true, hobby : '足球'},
        {id : 2, name : '李四', age : 20, sex : false, hobby : '排球'},
        {id : 3, name : '王五', age : 25, sex : true, hobby : '篮球'}
    ]);

    $('.populate').children('span').text(UserEntity.count());

    var all = UserEntity.all();
    for(var i in all) {
        var $row = $('<span></span>')
            .text(all[i].id + '--' + all[i].name + '--' + all[i].age + '--' + all[i].sex + '--' + all[i].hobby);
        $('.all').children('span').append($row).append('<br>');
    }

    var attr = UserEntity.find(2).attributes();
    for(var i in attr) {
        $('.attributes').children('span').append(i + ' : ' + attr[i] + '<br/>');
    }

    var json = UserEntity.find(3).toJSON();
    $('.toJSON').children('span').text(json);

    UserEntity.find(1).saveLocal('user');

    u = new UserEntity();

    u.loadLocal('user');
    $('.loadLocal').children('span').text(u.id + '--' + u.name + '--' + u.age + '--' + u.sex + '--' + u.hobby);

    $('.removeLocalBtn').click(function() {
        u.removeLocal('user');
    });

    UserEntity.find(2).saveSession('user1');

    u.loadSession('user1');
    $('.loadSession').children('span').text(u.id + '--' + u.name + '--' + u.age + '--' + u.sex + '--' + u.hobby);

    $('.removeSessionBtn').click(function() {
        u.removeSession('user1');
    });

    var Password = new sepa.Class(sepa.BaseModel);
    Password.create(['id', 'password', 'salt']);

    var Pwd = new sepa.Class([Password, sepa.Model]);

    Pwd.populate([
        {id : 1, password : '123456', salt : 'aa'},
        {id : 2, password : '654321', salt : 'bb'}
    ]);

    Pwd.each(function(val, idx, arr) {
        console.log(val.id + ',' + val.password + ',' + val.salt);
    });

})();

(function() {
    var sepa = org.eocencle.sepa;

    var Ctrl = new sepa.Class([sepa.Controller, sepa.CRemote, sepa.CVaildate, sepa.CElement, sepa.StateMachine]);

    Ctrl.include({
        elements : {
            '.required .email' : '$email',
            '.required span' : '$errMsg',
            '.ajax span' : '$ajaxErrMsg',
            '.state .output' : '$output'
        },

        events : {
            'click .required .requiredBtn' : 'requiredClick',
            'mouseout .ajax .name' : 'ajaxMouseout',
            'click .ajax .ajaxBtn' : 'ajaxClick',
            'click .state .state1' : 'state1Click',
            'click .state .state2' : 'state2Click',
            'click .state .state3' : 'state3Click'
        },

        config : {
            test : {
                path : '/sepa/test',
                params : {
                    name : 'miss'
                },
                callback : function(data) {
                    console.log('ok');
                }
            }
        },

        load : function() {
            this.component('remote', ['test']);
            this.ajaxFunc = this.component('bind', ['name', '/user/name']);

            this.setup(['status1', 'status2', 'status3']);
            this.status1(function() {
                this.$output.text('state1');
            });
            this.status2(function() {
                this.$output.text('state2');
            });
            this.status3(function() {
                this.$output.text('state3');
            });
        },

        requiredClick : function() {
            var result = this.component('vaildate', ['email', '亲,请输入合法的邮箱!', this.$email.val()]);
            if(result) {
                this.$errMsg.text(result);
            } else {
                this.$errMsg.empty().append(this.component('element', ['strong']).text('验证成功!'));
            }
        },

        ajaxMouseout : function(event) {
            this.ajaxFunc.call(this, 'name', $(event.currentTarget));
        },

        ajaxClick : function() {
            this.$ajaxErrMsg.text(this.component('vaildate', ['remote', null, 'name']));
        },

        testResult : function(data) {

        },

        state1Click : function(event) {
            this.status1();
        },

        state2Click : function(event) {
            this.status2();
            this.status2('delete');
        },

        state3Click : function(event) {
            this.status3();
        }
    });

    new Ctrl('body');
})();

//数据模型有序性测试
(function() {
    var array = new Array();

    array.push(1);
    array.push(2);
    array.push(3);

    console.log(array.join(','));

    array.splice(1, 2);
    console.log(array.join(','));

    var sepa = org.eocencle.sepa;

    var User = new sepa.Class(sepa.BaseModel);
    User.create(['id', 'name']);

    var UserEntity = new sepa.Class([User, sepa.Model]);

    UserEntity.populate([{id : 3, name : '张三'},{id : 2, name : '李四'},{id : 1, name : '王五'}]);

    var users = UserEntity.all();
    for(var i in users) {
        console.log(users[i].id + '---' + users[i].name);
    }
})();

//分页测试
(function() {
    var sepa = org.eocencle.sepa;

    var MyPage = new sepa.Class();

    MyPage.include({
        blocks : {
            'prevBtnBlk' : 'prevBtnEl',
            'nextBtnBlk' : 'nextBtnEl',
            'actBtnBlk' : 'actBtnEl',
            'pageBtnBlk' : 'pageBtnEl',
            'moitBtnBlk' : 'moitBtnEl'

        },
        config : {
            page : {
                block : 5,
                container : 'ul.p',
                btnFontPos : 'a',
                btns : {
                    prevBtn : 'prevBtnEl',
                    nextBtn : 'nextBtnEl',
                    actBtn : 'actBtnEl',
                    pageBtn : 'pageBtnEl',
                    moitBtn : 'moitBtnEl'
                },
                methods : {
                    prevMethod : 'pervClick',
                    nextMethod : 'nextClick',
                    pageMethod : 'pageClick'
                }
            }
        },
        prevBtnBlk : function() {
            var li = this.component('element', ['li']).addClass('prev').css({'float':'left', 'list-style-type':'none', 'width':'30px'});
            var a = this.component('element', ['a']).attr('href', 'javascript:void(0);').append('&lt;');
            li.append(a);
            return li;
        },

        nextBtnBlk : function() {
            var li = this.component('element', ['li']).addClass('next').css({'float':'left', 'list-style-type':'none', 'width':'30px'});
            var a = this.component('element', ['a']).attr('href', 'javascript:void(0);').append('&gt;');
            li.append(a);
            return li;
        },

        actBtnBlk : function() {
            var li = this.component('element', ['li']).css({'float':'left', 'list-style-type':'none', 'width':'30px'});
            var a = this.component('element', ['a']).attr('href', 'javascript:void(0);').addClass('current').css('color','red');
            li.append(a);
            return li;
        },

        pageBtnBlk : function() {
            var li = this.component('element', ['li']).addClass('num').css({'float':'left', 'list-style-type':'none', 'width':'30px'});
            var a = this.component('element', ['a']).attr('href', 'javascript:void(0);');
            li.append(a);
            return li;
        },

        moitBtnBlk : function() {
            return this.component('element', ['li']).text(' ... ').css({'float':'left', 'list-style-type':'none', 'width':'30px'});
        }
    });

    var PageCtrl = new sepa.Class([sepa.Controller, sepa.CElement, sepa.CPage, MyPage]);

    PageCtrl.include({

        currPage : '',

        totalPage : 49,

        load : function() {
            this.component('openPage', ['page']);
            this.show(1);
        },

        show : function(currPage) {
            this.currPage = currPage;
            this.component('paginate', [currPage, this.totalPage]);
        },

        pervClick : function() {
            this.show(this.currPage - 1);
        },

        nextClick : function() {
            this.show(this.currPage + 1);
        },

        pageClick : function(event) {
            this.show(parseInt($(event.target).text()));
        }

    });

    new PageCtrl('div.page');
})();

//DOM渲染
(function() {
    var sepa = org.eocencle.sepa;

    var DomCtrl = new sepa.Class([sepa.Controller, sepa.CDomRenderRole]);

    DomCtrl.include({

        elements : {
            'div.test1' : 'test1'
        },

        load : function() {
            this.component('domRenderRole', [false, this.test1, '张三']);
            this.component('domRenderRole', [false, this.test1, 'color:red;', 'style']);
            console.log(this.component('domRenderRole', [true, this.test1, '', 'class']));
        }

    });

    new DomCtrl('div.render');
})();
/**
 * mvvm测试
 */
(function() {
    var data = {content : ''};

    function observe(data) {
        if (!data || typeof data !== 'object') {
            return;
        }
        // 取出所有属性遍历
        Object.keys(data).forEach(function(key) {
            defineReactive(data, key, data[key]);
        });
    }

    function defineReactive(data, key, val) {
        observe(val); // 监听子属性
        Object.defineProperty(data, key, {
            set: function(newVal) {
                $('label', 'div.mvvm').text(newVal);
                val = newVal;
            }
        });
    }

    observe(data);
    $('div.mvvm').on('input propertychange', 'input', function() {
        data.content = $(this).val();
    });
})();
