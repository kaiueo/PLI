
var first_class_conj = [];
var first_class_conj_names = []
var custom_conj = [];
var custom_conj_names = []
var custom_conj_err_msg = '';
var parsed_ql_expression = [];
var origin_parsed_ql_expression = []
var var_names = []; // 存储变元对象
var var_name_list = []; // 存储变元名称

var generated_expressions = [];
var expression_records = [];
var base_expressions = [];
var advance_expressions = [];
var tmp_generated_expressions = [];

function QLElement(type, name) {
    this.type = type;
    this.name = name;
    this.value = 0;
}

var QLETYPE = {
    TERM: 0,
    CONJ: 1,
    FIRC: 2,
}

// 将公式文本解析为本程序计算的存储公式元素的数组
function parse_ql_expression(ql_expression) {
    var i = 0;
    ql_expression = ql_expression.replace(/[ \n]+/g, '');
    while (i < ql_expression.length) {
        if (ql_expression[i].search(/[A-Za-z]/) != -1) {
            result = get_var_name(ql_expression, i);
            name = result['name'];
            i = result['offset'];
            if (custom_conj_names.indexOf(name)==-1 && i + 1 < ql_expression.length && ql_expression[i + 1] == '('){
                show_message('联结词' + name + '未定义');
                return false;
            } else if  (custom_conj_names.indexOf(name) != -1) {
                if(custom_conj[name].num==0){
                    var zero_connection = new QLElement(QLETYPE.CONJ, name);
                    zero_connection.value = custom_conj[name][0];
                    parsed_ql_expression.push(zero_connection);
                }else{
                    parsed_ql_expression.push(new QLElement(QLETYPE.CONJ, name));
                }
            } else {
                if (var_name_list.indexOf(name) == -1) {
                    var_name_list.push(name);
                    var_names[name] = new QLElement(QLETYPE.TERM, name);
                }
                parsed_ql_expression.push(var_names[name]);
            }
        } else if (ql_expression[i].search(/[01]/) != -1) {
            parsed_ql_expression.push(parseInt(ql_expression[i]));
        } else if (ql_expression[i].search(/[¬∧∨→⊕↔),(]/) != -1) {
            parsed_ql_expression.push(ql_expression[i]);
        } else {
            show_message("存在非法字符" + ql_expression[i]);
            return false;
        }
        i = i + 1;
    }
    parsed_ql_expression.splice(0, 0, '(');
    parsed_ql_expression.push(')');
    return true;
}

// 为公式赋值
// i: 所赋的值
// len: 公式中变元的个数
function assion_value(i, len){
    bin_list = dec2bin(i, len);
    for(j=0;j<len;j++){
        var_names[var_name_list[j]].value = bin_list[j];
    }
}

// 将十进制的数转换为二进制的数组
// n: 带转换的十进制数
// len: 二进制数组的长度
function dec2bin(n, len){
    bin_list = []
    if(n==0){
        bin_list = [0];
    }else{
        bin_list = [];
        while(n>0){
            r = n%2;
            n = parseInt(n/2);
            bin_list.unshift(r);
        }
    }
    while(bin_list.length<len){
        bin_list.unshift(0);
    }
    return bin_list;
    
}

// 计算公式的值
function calculate(parsed_ql_expression) {
    var last_lp_index = 0;
    while ((last_lp_index = parsed_ql_expression.lastIndexOf('(')) != -1) {
        var rp_index = last_lp_index + 1;
        while (parsed_ql_expression[rp_index] != ')') {
            rp_index = rp_index + 1;
        }
        var tmp_expression = [];
        for(i=last_lp_index+1;i<rp_index;i++){
            tmp_expression.push(parsed_ql_expression[i]);
        }
        if(tmp_expression.indexOf(',')!=-1){
            if(last_lp_index-1<0||parsed_ql_expression[last_lp_index-1].type!=QLETYPE.CONJ){
                show_message("括号前缺少联结词！");
                throw new Error("括号前缺少联结词！");
            }
            var conj_name = parsed_ql_expression[last_lp_index-1].name;
            if(custom_conj[conj_name].num==0){
                show_message("0元联结词"+conj_name+"后面不能接参数！");
                throw new Error("0元联结词后不能接参数！");
            }
            var expression_value = get_function_value(conj_name, custom_conj[conj_name].num, tmp_expression);
            replace_expression(parsed_ql_expression, last_lp_index - 1, rp_index, expression_value); //左边要包含联结词名称
        } else if (tmp_expression.indexOf('∧') != -1 ||
            tmp_expression.indexOf('∨') != -1 ||
            tmp_expression.indexOf('⊕') != -1 ||
            tmp_expression.indexOf('→') != -1 ||
            tmp_expression.indexOf('↔') != -1) {

            var expression_value = calculate_no_bucket_expression(tmp_expression);
            replace_expression(parsed_ql_expression, last_lp_index, rp_index, expression_value);
        }else{
            if(tmp_expression.length==0){
                show_message("括号里内容不能为空！");
                throw new Error("括号里内容不能为空！");
            }
            
            term_value = get_term_value(tmp_expression);
            if(last_lp_index-1>=0&&parsed_ql_expression[last_lp_index-1].type==QLETYPE.CONJ){
                var conj_name = parsed_ql_expression[last_lp_index-1].name;
                var func = custom_conj[conj_name];
                if(func.num==0){
                    show_message("0元联结词"+conj_name+"后面不能接参数！");
                    throw new Error("0元联结词后不能接参数！");
                }
                if(func.num!=1){
                    show_message("联结词"+func.name+"需要"+func.num+"个参数！");
                    throw new Error("联结词参数不匹配");
                }
                var expression_value = func[term_value];
                //var expression_value = get_function_value(conj_name, custom_conj[conj_name].num, tmp_expression);
                replace_expression(parsed_ql_expression, last_lp_index - 1, rp_index, expression_value); 
            }else{
                replace_expression(parsed_ql_expression, last_lp_index, rp_index, term_value);
            }
            
        }
    }

}

// 计算没有括号的公式的值（公式内部的子公式）
function calculate_no_bucket_expression(inner_expression){
    if (inner_expression.indexOf('∧') == -1 &&
        inner_expression.indexOf('∨') == -1 &&
        inner_expression.indexOf('⊕') == -1 &&
        inner_expression.indexOf('→') == -1 &&
        inner_expression.indexOf('↔') == -1) {
        return get_term_value(inner_expression);
    }

    while(inner_expression.length!=1){
        if(inner_expression.indexOf('∧')!=-1){
            get_first_class_conj_value(inner_expression, '∧');

        }else if(inner_expression.indexOf('∨')!=-1){
            get_first_class_conj_value(inner_expression, '∨');
            
        }else if(inner_expression.indexOf('⊕')!=-1){
            get_first_class_conj_value(inner_expression, '⊕');
            
        }else if(inner_expression.indexOf('→')!=-1){
            get_first_class_conj_value(inner_expression, '→');
            
        }else if(inner_expression.indexOf('↔')!=-1){
            get_first_class_conj_value(inner_expression, '↔');

        }
    }
    return inner_expression[0];
}

// 得到原生二元联结词（∧,∨,→,⊕,↔）的值
// inner_expression: 包含原生二元联结词的公式
// conj_name: 原生二元联结词
function get_first_class_conj_value(inner_expression, conj_name){

    var r_index = inner_expression.indexOf(conj_name);
    var l_index = r_index-1;
    while(l_index>=0&&is_var(inner_expression[l_index])){
        l_index = l_index - 1;
    }
    l_index = l_index + 1;
    var left = l_index;
    var term_values = [];

    for(i=0;i<2;i++){
        term = []
        if(l_index==r_index){
            show_message("联结词"+conj_name+"缺少变元！");
            throw new Error("连接词缺少变元！")
        }
        for(var j=l_index;j<r_index;j++){
            term.push(inner_expression[j]);
        }
        term_value = get_term_value(term);
        term_values.push(term_value);

        // 防止r_index越界
        if (i == 0) {
            l_index = r_index + 1;
            r_index = l_index;
            while (r_index < inner_expression.length && is_var(inner_expression[r_index])) {
                r_index = r_index + 1;
            }
        }
        
    }
    func = first_class_conj[conj_name];
    var expression_value = func[bin2dec(term_values)];
    replace_expression(inner_expression, left, r_index-1, expression_value);
}

// 判断一个元素是否为变元
function is_var(qlelement){
    if(qlelement=='∧'||qlelement=='∨'||qlelement=='→'||qlelement=='⊕'||qlelement=='↔'){
        return false
    }
    return true;

}

// 将公式指定位置替换为指定的内容
// expression: 公式
// left: 待替换左起位置
// right: 待替换的右端位置
// value: 要替换的值
function replace_expression(expression, left, right, value){
    expression.splice(left, right-left+1);
    expression.splice(left, 0, value);
}

// 得到包含联结词的公式的值
// function_name: 联结词名称
// function_dim: 联结词的元数
// inner_expression: 待求值公式
function get_function_value(function_name, function_dim, inner_expression){
    var tmp_inner_expression = inner_expression.slice(0);
    l_index = 0;
    r_index = tmp_inner_expression.indexOf(',');
    var term_values = [];

    while(r_index!=-1){
        if(r_index==0){
            show_message("联结词"+function_name+"参数错误！");
            throw new Error("联结词参数不匹配");
        }
        var term = [];
        for(var i = 0;i<r_index;i++){
            term.push(tmp_inner_expression[i]);
        }
        term_value = calculate_no_bucket_expression(term);
        term_values.push(term_value);
        tmp_inner_expression.splice(0, r_index+1);
        r_index = tmp_inner_expression.indexOf(',');
    }

    if(tmp_inner_expression.length==0){
        show_message("联结词"+function_name+"参数错误！");
        throw new Error("联结词参数不匹配");
    }else{
        var term = [];
        for(var i = 0;i<tmp_inner_expression.length;i++){
            term.push(tmp_inner_expression[i]);
        }
        term_value = calculate_no_bucket_expression(term);
        term_values.push(term_value);
    }

    if(function_dim!=term_values.length){
        
        show_message("联结词"+function_name+"需要"+function_dim+"个参数！");
        throw new Error("联结词参数不匹配");
    }
    func = custom_conj[function_name];
    return func[bin2dec(term_values)];
}

// 将二进制数组转换为十进制的数值
function bin2dec(binary_array){
    binary_array.reverse();
    var decimal = 0;
    for(var i=0;i<binary_array.length;i++){
        decimal = decimal + binary_array[i] * Math.pow(2, i);
    }
    return decimal;
}

// 得到某一个项的值
function get_term_value(term){
    // 前面无非符号
    if(term.length==1){
        if(term[0]=='¬'){
            show_message("¬后缺少变元！");
            throw new Error("¬后缺少变元！");
        }
        if(term[0]==0||term[0]==1){
            return term[0];
        }
        else{
            if(term[0].type!=QLETYPE.TERM&&!(term[0].type==QLETYPE.CONJ&&custom_conj[term[0].name].num==0)){
                show_message("联结词"+term[0].name+"后面缺少相应的参数！");
                throw new Error("联结词后缺少参数！");
            }else{
                return term[0].value;
            }
            
        }
    }else{
        if(term[1]==0){
            return 1;
        }else if(term[1]==1)
        {
            return 0;
        }else{
            if(term[1].type!=QLETYPE.TERM&&!(term[1].type==QLETYPE.CONJ&&custom_conj[term[1].name].num==0)){
                show_message("联结词"+term[1].name+"后面缺少相应的参数！");
                throw new Error("联结词后缺少参数！");
            }else{
                if(term[1].value==0){
                    return 1;
                }else{
                    return 0;
                }
            }
        }
    }
}

// 从公式文本中解析出变量名字
function get_var_name(qlf, offset) {
    name = qlf[offset];
    while (offset + 1 < qlf.length && qlf[offset + 1].search(/[¬∧∨→⊕↔),(]/) == -1) {
        offset = offset + 1;
        name = name + qlf[offset];
    }
    var result = []
    result['name'] = name;
    result['offset'] = offset;
    return result;
}


//生成第一类逻辑联结词
function generate_first_class_conj() {
    var a = '0,1,¬,∧,∨,→,⊕,↔';
    notc = [1, 0];
    conj = [0, 0, 0, 1];
    disj = [0, 1, 1, 1];
    impc = [1, 1, 0, 1];
    xorc = [0, 1, 1, 0];
    equc = [1, 0, 0, 1];
    first_class_conj['¬'] = notc;
    first_class_conj['∧'] = conj;
    first_class_conj['∨'] = disj;
    first_class_conj['→'] = impc;
    first_class_conj['⊕'] = xorc;
    first_class_conj['↔'] = equc;
    first_class_conj_names = ['¬', '∧', '∨', '→', '⊕', '↔'];
}

// 生成联结词计算函数
// name: 联结词名称
// num: 连接词元数
// truth: 连接词真值表最后一列
function generate_conj(name, num, truth) {
    var conj = [];
    conj.name = name;
    conj.num = parseInt(num);
    conj.truth_num = Math.pow(2, conj.num);
    truth = truth.replace(/ +/g, ''); // 去除truth中所有的空格
    if (truth.search(/[^01]/) != -1) {
        is_success = false;
        custom_conj_err_msg = custom_conj_err_msg + "联结词" + name + "的真值只能为0或1\n";
        return false;
    }
    if (truth.length == conj.truth_num) {
        for (i = 0; i < truth.length; i++) {
            conj.push(parseInt(truth[i]));
        }

        custom_conj[conj.name] = conj;
        custom_conj_names.push(conj.name);
        return true;
    } else {
        custom_conj_err_msg = custom_conj_err_msg + "联结词" + conj.name + "最后一列应为" + conj.truth_num + "个真值\n";
        return false;
    }
}

// 显示结果
// message: 要现实的信息 
// type: 0（只显示信息）、1（显示判断公式是否为永真永假判断的信息）、2（显示联结词集不完全时的信息）、3（显示联结词完全时的信息）
// array: 仅当type为1时使用，此时存储的为使公式为真时的变元赋值信息
function show_message(message, type=0, arr=[]) {
    var messagelabel = document.getElementById('messagelabel');
    var resultdiv = document.getElementById('resultdiv');
    messagelabel.innerText = '';
    resultdiv.innerHTML = '';
    switch (type) {
        case 0:
            messagelabel.innerText = message;
            break;
        case 1:
            messagelabel.innerText = message;
            var result_table = document.createElement('table');
            var len = var_name_list.length;
            var tr1 = document.createElement('tr');
            for(var i = 0;i<len;i++){
                var td1 = document.createElement('td');
                td1.innerText = var_name_list[i];
                tr1.appendChild(td1);
            }
            result_table.appendChild(tr1);
            for (var i = 0; i < arr.length; i++) {
                var tmp_tr = document.createElement('tr');
                for (var j = 0; j < arr[i].length; j++) {
                    var tmp_td = document.createElement('td');
                    tmp_td.innerText = arr[i][j];
                    tmp_tr.appendChild(tmp_td);

                }
                result_table.appendChild(tmp_tr);
            }
            resultdiv.appendChild(result_table);
            break;
        case 2:
            messagelabel.innerText = message;
            var result_table = document.createElement('table');
            for(var i = 0;i<generated_expressions.length;i++){
                var exp_text = get_expression_text(generated_expressions[i]);
                var tmp_tr = document.createElement('tr');
                tmp_tr.innerText = exp_text;
                result_table.appendChild(tmp_tr);
            }
            resultdiv.appendChild(result_table);
            break;
        case 3:
            messagelabel.innerText = message;
            var result_table = document.createElement('table');
            for(var i = 0;i<generated_expressions.length;i++){
                var exp_text = get_expression_text(generated_expressions[i]);
                var tmp_tr = document.createElement('tr');
                tmp_tr.innerText = exp_text;
                result_table.appendChild(tmp_tr);
            }
            var notp_text = '¬p↔'+get_expression_text(generated_expressions[expression_records[12]]);
            var impc_text = 'p→q↔'+get_expression_text(generated_expressions[expression_records[13]]);
            var impc_tr = document.createElement('tr');
            var notp_tr = document.createElement('tr');
            impc_tr.innerText = impc_text;
            notp_tr.innerText = notp_text;
            result_table.appendChild(impc_tr);
            result_table.appendChild(notp_tr);
            resultdiv.appendChild(result_table);
    }
    //document.getElementById('messagelabel').innerText = message;
}

// 将程序内部存储的公式转换为文本显示的公式
function get_expression_text(expression){
    var exp_text = "";
    for(var i = 0;i<expression.length;i++){
        if(expression[i].type==QLETYPE.CONJ){
            exp_text = exp_text + expression[i].name;
        }else if(expression[i].type==QLETYPE.TERM){
            exp_text = exp_text + expression[i].name;
        }else{
            exp_text = exp_text + expression[i];
        }
    }
    return exp_text;
}

// 判断是否为永真式
function is_tautology() {

    custom_conj = [];
    custom_conj_err_msg = '';
    custom_conj_names = [];
    var_name_list = [];
    var_names = [];
    parsed_ql_expression = [];
    first_class_conj_names = [];
    first_class_conj = [];
    show_message('');

    generate_first_class_conj()
    var pletext = document.getElementById('pletext').value;
    if (!custom_func_define(pletext)) {
        return;
    }
    ql_expression = pletext.replace(/#[ \n]*?(?<define>((\w[\w\d]*) +?(\d+) +?((\d+ *)+)[ \n]*)+)/g, ''); // 去除输入的文本中自定义联结词的部分
    check_ql_expression(ql_expression);
    if(parse_ql_expression(ql_expression)==false){
        return;
    }
    origin_parsed_ql_expression = parsed_ql_expression.slice(0);
    len = var_name_list.length;
    maxdec = Math.pow(2,len);
    result_truth = [];
    result_truth.var_len = len;
    for(var ith=0;ith<maxdec;ith++){
        assion_value(ith, len);
        calculate(parsed_ql_expression);
        result_truth.push(parsed_ql_expression[0]);
        parsed_ql_expression = origin_parsed_ql_expression.slice(0);
    }


    if (result_truth.indexOf(0) == -1) {
        show_message('永真式');
        tfflag = 1;
    } else if (result_truth.indexOf(1) == -1) {
        show_message('永假式');
    } else {
        var_value = [];
        for (i = 0; i < result_truth.length; i++) {
            if (result_truth[i] == 1) {
                var_value.push(dec2bin(i, var_name_list.length));
            }
        }
        show_message('不是永真式,当且仅当变量取以下值时为真：',1, var_value);
    }

}

// 对用户输入的公式进行基本的语法检查
function check_ql_expression(pletext) {
    var ql_expression_text = pletext.replace(/[ \n]+/g, '');
    var bucket = [];
    if(ql_expression_text.length==0){
        show_message("公式为空！");
        throw new Error("公式为空！");
    }
    var i = 0;

    if(/\)[A-Za-z0-9]?\(/.test(ql_expression_text)==true){
        show_message("括号不匹配！");
        throw new Error("括号不匹配！");
    }

    while(i<ql_expression_text.length){
        if(ql_expression_text[i]=='('){
            bucket.push('(');
        }
        else if(ql_expression_text[i]==')'){
            if(bucket.length>0){
                bucket.pop();
            }else{
                show_message("括号不匹配！");
                throw new Error("括号不匹配！");
            }
        }else if(ql_expression_text[i].search(/[A-Za-z]/) != -1){
            var result = get_var_name(ql_expression_text, i);
            i = result['offset'];
        }else if(ql_expression_text[i].search(/[0-9]/)!=-1){
            if(i+1<ql_expression_text.length&&ql_expression_text[i+1].search(/[A-Za-z]/)!=-1){
                show_message("变量不能以数字开头！");
                throw new Error("变量不能以数组开头!");
            }
        }
        i = i+1;
    }
    if(bucket.length!=0){
        show_message("括号不匹配！");
        throw new Error("括号不匹配！");
    }

}

// 自定义联结词解析
function custom_func_define(pletext) {

    /* 
        自定义联结词的正则，开头为#，后面0或多个空格或换行
        此处定义一分组
        然后为字母开头后面为字母或数字的联结词命名，后面跟1或多个空格
        然后为多个数字，后面跟1个或多个空格
        然后为多个数字，数字之间可有空格也可没有空格
    */
    var custom_func_re = /#[ \n]*?(?<defines>((\w[\w\d]*) +?(\d+) +?((\d+ *)+)[ \n]*)+)/;
    ///#\n*?(?<defines>((\w[\w\d]*) +?(\d+) +?((\d+ *)+)\n*)+)/;


    match_groups = custom_func_re.exec(pletext);
    if (match_groups == null) {
        return true;
    }
    all_defines = match_groups.groups.defines;

    /*
        上面正则中取消前面#换行部分剩下的内容
    */
    var is_success = true
    defines_re = /(\w[\w\d]*) +?(\d+) +?((\d+ *)+)\n*/g;
    while ((func_define = defines_re.exec(all_defines)) != null) {
        define_re = /(?<name>\w[\w\d]*) +?(?<num>\d+) +?(?<truth>(\d+ *)+)/;
        define = define_re.exec(func_define);
        var name = define.groups.name;
        var num = define.groups.num;
        var truth = define.groups.truth;

        is_success = generate_conj(name, num, truth) && is_success
    }

    // 判断生成自定义联结词的过程中有没有错误
    if (!is_success) {
        show_message(custom_conj_err_msg);
        return false;
    }

    return true;


}

// 可重复排列函数
// n_array: 待排列物品的个数
// n_len: 排列结果的长度
function rp(n_array, n_len) {
    var result = [];
    var arr = [];
    for(var i = 0;i<n_array;i++){
        arr.push(i);
    }
    var cal = function(r, a, c) {
        if (c == 0||a.length == 0) {
            result.push(r);
            return;
        }
        for (var i = 0; i < a.length; i++) {
            cal(r.concat(a[i]), a.slice(0, i + 1).concat(a.slice(i + 1)), c - 1);
        }
    };
    cal([], arr, n_len);
    return result;
}

// 判断是否完全集
function funcompleset(){
    custom_conj = [];
    custom_conj_err_msg = '';
    custom_conj_names = [];
    var_name_list = [];
    var_names = [];
    parsed_ql_expression = [];
    first_class_conj_names = [];
    first_class_conj = [];
    generated_expressions = [];
    expression_records = [];
    base_expressions = [];

    for(var i = 0;i<16;i++){
        expression_records[i] = -1;
    }
    var_name_list.push("p");
    var_names["p"] = new QLElement(QLETYPE.TERM, "p");
    var_name_list.push("q");
    var_names["q"] = new QLElement(QLETYPE.TERM, "q");

    generated_expressions.push([var_names["p"]]);
    expression_records[3] = 0;
    generated_expressions.push([var_names["q"]]);
    expression_records[5] = 1;

    show_message('');

    generate_first_class_conj()
    var pletext = document.getElementById('pletext').value;
    if (!custom_func_define(pletext)) {
        return;
    }

    base_expressions.push([var_names["p"]]);
    base_expressions.push([var_names["q"]]);
    advance_expressions = [];
    tmp_generated_expressions = [];
    var fcs_result = false;

    for(var i = 0;i<25;i++){
        fcs_result = generate_expression();
        for(var j = 0;j<advance_expressions.length;j++){
            base_expressions.push(advance_expressions[j]);
        }
        advance_expressions = [];
        for(var j = 0;j<tmp_generated_expressions.length;j++){
            advance_expressions.push(tmp_generated_expressions[j]);
        }
        tmp_generated_expressions = [];
        if(fcs_result==true){
            show_message("完全.\n全部16个公式：", 3);
            break;
        }
    }

    if(fcs_result==false){
        show_message("不完全.\n可以生成"+generated_expressions.length+"个互不等值的公式：", 2);
    }

}

// 生成公式
function generate_expression(){
    var con_len = custom_conj_names.length;
    var max_num = 0;

    for(var i = 0;i<con_len;i++){
        if(custom_conj[custom_conj_names[i]].num>max_num){
            max_num = custom_conj[custom_conj_names[i]].num;
        }
    }

    var min_i = 0;
    if(advance_expressions.length>0){
        min_i = 1;
    }

    for (var i = min_i; i <= max_num; i++) {
        for (var j = 0; j < con_len; j++) {
            var conj = custom_conj[custom_conj_names[j]];
            if (conj.num >= i) {
                var rp_result_adv = rp(advance_expressions.length, i);
                var base_len = conj.num - rp_result_adv[0].length;
                var rp_result_base = rp(base_expressions.length, base_len);
                for (var a = 0; a < rp_result_adv.length; a++) {
                    for (var b = 0; b < rp_result_base.length; b++) {
                        assemble_expression_general(conj, rp_result_adv[a], rp_result_base[b]);
                        if(generated_expressions.length==16){
                            return true;
                        }
                    }
                }
            }

        }
    }
    if(generated_expressions.length<16){
        return false;
    } 
}


// 将联结词和参数组装为公式
// conj: 联结词
// rp_adv: 要组装的高级公式
// rp_base: 要组装的基本公式
function assemble_expression(conj, rp_adv, rp_base){
    var expression = [];
    expression.push(new QLElement(QLETYPE.CONJ, conj.name));
    expression.push('(');
    for(var i = 0;i<rp_adv.length;i++){
        var tmp_exp = base_expressions[rp_adv[i]];
        expression = expression.concat(tmp_exp);
        expression.push(',');
    }
    for(var i = 0;i<rp_base.length;i++){
        expression.push(var_names[var_name_list[rp_base[i]]]);
        expression.push(',');
    }
    expression.splice(expression.length-1);
    expression.push(')');

    return expression;
}


// 将联结词和参数组装为公式
// conj: 联结词
// rp_adv: 要组装的高级公式
// rp_base: 要组装的基本公式
function assemble_expression_general(conj, rp_adv, rp_base){
    
    var rp_exp = [];
    for(var i = 0;i<rp_adv.length;i++){
        rp_exp.push(advance_expressions[rp_adv[i]]);
    }
    for(var i = 0;i<rp_base.length;i++){
        rp_exp.push(base_expressions[rp_base[i]]);
    }
    var per_arr = [];
    for(var i = 0;i<rp_exp.length;i++){
        per_arr.push(i);
    }
    var per_result = permutation(per_arr);
    for(var i = 0;i<per_result.length;i++){
        var expression = [];
        expression.push(new QLElement(QLETYPE.CONJ, conj.name));
        expression.push('(');
        for(var j = 0;j<per_result[i].length;j++){
            var tmp_exp = rp_exp[per_result[i][j]];
            expression = expression.concat(tmp_exp);
            expression.push(',');
        }
        expression.splice(expression.length-1);
        expression.push(')');
        
        var truth_table = calculate_truth_table(expression);
        is_new_expression(expression, truth_table);
        
    }
    
}

// 计算公式的真值表
function calculate_truth_table(expression){
    parsed_ql_expression = expression.slice(0);
    var len = var_name_list.length;
    var maxdec = Math.pow(2,len);
    var result_truth = [];
    for(var ith=0;ith<maxdec;ith++){
        assion_value(ith, len);
        calculate(parsed_ql_expression);
        result_truth.push(parsed_ql_expression[0]);
        parsed_ql_expression = expression.slice(0);
    }
    return result_truth;
}

// 判断公式是否为新的联结词
// expression: 公式
// truth_table: 公式的真值表
function is_new_expression(expression, truth_table){
    var dec = bin2dec(truth_table);
    if(expression_records[dec]==-1){
        var len = generated_expressions.length;
        expression_records[dec] = len;
        generated_expressions.push(expression.slice(0));
        tmp_generated_expressions.push(expression.slice(0));
    }

}

// 生成排列
function permutation(arr){
	if (arr.length == 1)
		return [arr];
	else if (arr.length == 2)
		return [[arr[0],arr[1]],[arr[1],arr[0]]];
	else {
		var temp = [];
		for (var i = 0; i < arr.length; i++) {
			var save = arr[i];
			arr.splice(i, 1);//取出arr[i]
			var res = permutation(arr);//递归排列arr[0],arr[1],...,arr[i-1],arr[i+1],...,arr[n]
			arr.splice(i, 0, save);//将arr[j]放入数组，保持原来的位置
			for (var j = 0; j < res.length; j++) {
                //res[j].push(arr[i]);
                res[j].unshift(arr[i]);
				temp.push(res[j]);//将arr[j]组合起来
			}
		}
		return temp;
	}
}


