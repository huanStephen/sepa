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

})();

(function() {
    var sepa = org.eocencle.sepa;

    var Ctrl = new sepa.Class([sepa.Controller, sepa.CRemote, sepa.CVaildate, sepa.CElement]);

    Ctrl.include({
        elements : {
            '.required .email' : '$email',
            '.required span' : '$errMsg'
        },

        events : {
            'click .required .requiredBtn' : 'chkClick'
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
        },

        chkClick : function() {
            var result = this.component('vaildate', ['email', '亲,请输入合法的邮箱!', this.$email.val()]);
            if(result) {
                this.$errMsg.text(result);
            } else {
                this.$errMsg.append(this.component('element', ['strong']).text('验证成功!'));
            }
        },

        testResult : function(data) {

        }
    });

    new Ctrl('body');
})();