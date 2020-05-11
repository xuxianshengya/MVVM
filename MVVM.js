//  发布订阅
class Dep {
    constructor(){
        this.subs = []
    }
    // 订阅
    addSub(watcher){//添加 watcher
        this.subs.push(watcher)
    }
    // 发布
    notify(){
        this.subs.forEach(watcher => watcher.updata());
    }
}
//  观察者
class Watcher{
    constructor(vm,expr,cb){
        this.vm = vm
        this.expr = expr
        this.cb = cb
        //默认先存放一个老值
        this.oldValue = this.get();
    }
    get(){
        Dep.target = this// 将每个watcher放到全局
        // 取值，吧观察者和数据关联起来
        let value = CompileUtil.getVal(this.expr,this.vm);
        Dep.target = null
        return value 
    }
    updata(){//更新操作 数据变化后 会调用观察者的updata方法
        let newVal = CompileUtil.getVal(this.expr,this.vm)
        if(newVal !== this.oldValue ){
            this.cb(newVal)
        }
    }
}
// 数据劫持
class Observer{
    constructor(data){
        this.observer(data)
    }
    observer(data){
        // 如果是对象才观察
        if(data && typeof data == "object"){
            for(let key in data){
                this.defineReactive(data,key,data[key]);//劫持数据
            }
        }
    }
    defineReactive(obj,key,value){
        this.observer(value)//如果值是个对象的话，就再去劫持这个对象
        let dep = new Dep() //给每一个属性 都加上一个订阅者的功能     ---- 《重点》
        Object.defineProperty(obj,key,{
            get(){
                // 把watcher放到对应的dep中，更新的时候就只触发对应的那个dep
                Dep.target && dep.addSub(Dep.target)
                return value
            },
            set:(newval)=>{
                if(newval!==value){
                    this.observer(newval)//如果新值是一个对象，就要劫持这个对象
                    value = newval 
                    dep.notify();
                }
            },

        })
    }
}
// 编译
class Compiler{
    constructor(el,vm){
        this.el = this.ifElementNode(el)?el:document.getElementById(el)
        this.vm = vm
        // 1.将获取到的元素放到内存(文档碎片中documenFragment)
        let fragmeng = this.nodeFragment(this.el)
        // 2.对内存节点中的内容进行替换

        //用数据编译模板 
        this.compile(fragmeng)

        // 3.将内存塞到页面中
        this.el.appendChild(fragmeng)
    }
    // 判断是否以V-开头
    isDirective(attrName){
        return attrName.startsWith("v-")
    }
    // 编译元素(v-model,v-html,v-text,v-bind,v-on:click等等)
    compileElement(node){
        let attributes = node.attributes;
        [...attributes].forEach(attr=>{
            let {name,value:expr} = attr
            //判断是否是指令
            if(this.isDirective(name)){
                let [,directive] = name.split("-") //v-model,v-html,v-bind
                // 如果是v-on:click
                let [directiveName,eventName] = directive.split(":")
                // 需要调用不同的指令来处理
                CompileUtil[directiveName](node,expr,this.vm,eventName)
            }
        })
    }
    // 编译文本
    compileText(node){//判断文本节点中的内容是否含有{{}}
        let content = node.textContent
        if(/\{\{(.+?)\}\}/.test(content)){
            CompileUtil["text"](node,content,this.vm)
        }
    }
    // 核心编译方法
    compile(node){//用来编译内存中的dom节点
        let childNodes = node.childNodes
        let arr = [...childNodes]
        arr.forEach(child=>{
            if(this.ifElementNode(child)){//判断是dom还是文本节点
                this.compileElement(child)
                // 如果是元素,再去遍历它的子节点（递归）
                this.compile(child)
            } else {
                this.compileText(child)
            }
        })
    }
    // 将元素移入到内存
    nodeFragment(node){
        let fragmeng = document.createDocumentFragment();
        let firstChild;
        while (firstChild = node.firstChild){
            // appendChild 具有移动性，可以将元素移动到文档碎片中
            fragmeng.appendChild(firstChild)
        }
        return fragmeng
    }
    // 判断是否是元素节点
    ifElementNode(node){
        return node.nodeType === 1
    }
}
// 处理模板
CompileUtil = {
    getVal(expr,vm){
        let value = expr.split(".").reduce((data,current)=>{
            return data[current]
        },vm.$data)
        return value
    },
    setValue(vm,expr,value){
        expr.split(".").reduce((data,current,index,arr)=>{
            if(index == arr.length-1){
                return data[current] = value;
            }
            return data[current]
        },vm.$data)
    },
    // 解析v-model这个指令
    model(node,expr,vm){//node节点，expr表达式(user.name),vm当前实例
        let fn = this.updater.modelUpdater
        new Watcher(vm,expr,(newVal)=>{ //给输入框加一个观察者 ，如果稍后数据更新了会触发此方法，会拿新值赋给输入框
            fn(node,newVal)
        })
        // 监听有v-model的元素，视图变化改变数据
        node.addEventListener("input",(e)=>{
            let value = e.target.value
            this.setValue(vm,expr,value)
        })
        // 实例上获取内容
        let value = this.getVal(expr,vm)
        fn(node,value)
    },
    html(node,expr,vm){
        let fn = this.updater.htmlUpdater
        let value = this.getVal(expr,vm)
        fn(node,value)
    },
    getContentValue(vm,expr){
        // 遍历表达式 将内容全部替换并返回
        let content = expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{
            return this.getVal(args[1],vm)
        })
        return content
    },
    // 编译文本节点
    text(node,expr,vm){//expr可能会是{{a}}{{b}}这种情况
        let fn = this.updater.textUpdater
        let content = expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{
            // 给每个变量{{}}都加上观察者
            new Watcher(vm,args[1],()=>{
                fn(node,this.getContentValue(vm,expr))//返回一个完整的字符串
            })
            return this.getVal(args[1],vm)
        })
        fn(node,content)
    },
    // 编译事件
    on(node,expr,vm,eventName){
        node.addEventListener(eventName,(e)=>{
            vm[expr].call(vm,e)
        })
    },
    updater:{
        // 把元素插入到节点中
        modelUpdater(node,value){
            node.value = value
        },
        htmlUpdater(node,value){
            console.log(node)
            console.log(value)
            node.innerHTML = value
        },
        textUpdater(node,value){
            node.textContent = value
        }
    },
}
class Vue{
    constructor(options){
        this.$vm = options.el
        this.$data = options.data()
        let computed = options.computed
        let methods = options.methods
        // 元素存在 编译模板
        if(this.$vm){

            // 数据劫持，把所有数据全部转化成Object.defineProperty定义
            new Observer(this.$data)

            for(let key in computed){
                Object.defineProperty(this.$data,key,{//将computed代理到$data中，因为模板编译，CompileUtil.geVal取值的时候是在$data上取值的
                    get:()=>{
                        return computed[key].call(this)
                    }
                })
            }

            for(let key in methods){
                Object.defineProperty(this,key,{//将methods代理到vm上
                    get:()=>{
                        return methods[key]
                    }
                })
            }

            // 把数据获取操作 vm(this)上的取值 代理到 VM.$data
            this.proxVm(this.$data)

            new Compiler(this.$vm,this)
        }
    }
    proxVm(data){
        for(let key in data){
            Object.defineProperty(this,key,{//可以通过vm.直接取到对应的值
                get(){
                    return data[key];
                }
            })
        }
    }
}