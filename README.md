# sepa
Sepa is a MVC framework that about javascript.  
![](http://images.cnblogs.com/cnblogs_com/huanStephen/1128725/o_sepa-small.jpg)

# Design points :
 *  1、The namespace, to avoid naming conflicts.
 *  2、The public load and private load.
 *  3、Easy to use.
 *  4、Extensible.
 *  5、Class of reuse.
 *  6、Data rendering.
 *  7、Data structure and separation.

# 设计要点：
 *  1、命名空间，必要的情况下需要将三层命名空间划分开，避免命名冲突
 *  2、页面加载包含公开加载和内部加载，比如像网站的文章，属于公开在网站的，可以不用登录就可以直接输入地址访问的，这些页面的加载就是公开加载；像用户信息，只有用户登录之后才能加载的页面就是内部加载。公开加载需要把页面上的显示动作反应到URL里，以便非用户访问；内部加载只有在某些验证之后才可以加载，而不能直接访问，所以加载时避免URL改变。
 *  3、方便使用，尽量减少配置和函数，让使用更加简单。
 *  4、易于扩展，让用户追加插件容易，可以随时扩展框架。
 *  5、类的重用，将项目所有对象全部配置在一个文件，需要的时候进行继承，实例对象保存在继承后的实例里，避免一个页面同时使用相同实体造成对象覆盖或误清空。
 *  6、数据渲染，对每个结构都对应一种默认的渲染规则，也要保证可扩展性。
 *  7、结构和数据分离，html结构应该与js操作进行分离，使在js不变的情况下自由变换html结构，同样可以渲染。
