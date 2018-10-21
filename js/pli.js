function hello() {
    alert('hello')
}

var all_conj = []
var custom_conj = []

//生成联结词计算函数
function generate_conj(name ,num, truth) {
    var conj = []
    conj.name = name
    conj.num = num
    for(i=0;i<truth.length;i++){
        if(truth[i])
        {
            // TODO
        }
    }
}

function custom_func_define() {

    var custom_func_text = document.getElementById('pletext').value

    /* 
        自定义联结词的正则，开头为#，后面0或多个换行
        此处定义一分组
        然后为字母开头后面为字母或数字的联结词命名，后面跟1或多个空格
        然后为多个数字，后面跟1个或多个空格
        然后喂多个数字，数字之间可有空格也可没有空格
    */
    var custom_func_re = /#\n*?(?<defines>((\w[\w\d]*) +?(\d+) +?((\d+ *)+)\n*)+)/  

    match_groups = custom_func_re.exec(custom_func_text)
    all_defines = match_groups.groups.defines

    /*
        上面正则中取消前面#换行部分剩下的内容
    */
    defines_re = /(\w[\w\d]*) +?(\d+) +?((\d+ *)+)\n*/g
    while((func_define = defines_re.exec(all_defines)) != null){
        define_re = /(?<name>\w[\w\d]*) +?(?<num>\d+) +?(?<truth>(\d+ *)+)/
        define = define_re.exec(func_define)
        var name = define.groups.name
        var num = define.groups.num
        var truth = define.groups.truth
        generate_conj(name, num, truth)
    }


}
