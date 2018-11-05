
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


function parse_ql_expression(ql_expression) {
    var i = 0;
    ql_expression = ql_expression.replace(/[ \n]+/g, '');
    while (i < ql_expression.length) {
        if (ql_expression[i].search(/[A-Za-z]/) != -1) {
            result = get_var_name(ql_expression, i);
            name = result['name'];
            i = result['offset'];
            if (custom_conj_names.indexOf(name) != -1) {
                parsed_ql_expression.push(new QLElement(QLETYPE.CONJ, name));
            } else if (i + 1 < ql_expression.length && ql_expression[i + 1] == '(') {
                show_message('联结词' + name + '未定义');
                return false;
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

function assion_value(i, len){
    bin_list = dec2bin(i, len);
    for(j=0;j<len;j++){
        var_names[var_name_list[j]].value = bin_list[j];
    }
}

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
            var conj_name = parsed_ql_expression[last_lp_index-1].name;
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
            term_value = get_term_value(tmp_expression);
            if(last_lp_index-1>=0&&parsed_ql_expression[last_lp_index-1].type==QLETYPE.CONJ){
                var conj_name = parsed_ql_expression[last_lp_index-1].name;
                var func = custom_conj[conj_name];
                var expression_value = func[term_value];
                //var expression_value = get_function_value(conj_name, custom_conj[conj_name].num, tmp_expression);
                replace_expression(parsed_ql_expression, last_lp_index - 1, rp_index, expression_value); 
            }else{
                replace_expression(parsed_ql_expression, last_lp_index, rp_index, term_value);
            }
            
        }
    }

}

function calculate_no_bucket_expression(inner_expression){
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

function get_first_class_conj_value(inner_expression, conj_name){

    var r_index = inner_expression.indexOf(conj_name);
    l_index = r_index-1;
    while(l_index>=0&&is_var(inner_expression[l_index])){
        l_index = l_index - 1;
    }
    l_index = l_index + 1;
    left = l_index;
    term_values = [];

    for(i=0;i<2;i++){
        term = []
        for(var j=l_index;j<r_index;j++){
            term.push(inner_expression[j]);
        }
        term_value = get_term_value(term);
        term_values.push(term_value);

        // 防止r_index越界
        if (i == 0) {
            l_index = r_index + 1;
            r_index = l_index + 1;
            while (r_index < inner_expression.length && is_var(inner_expression[r_index])) {
                r_index = r_index + 1;
            }
        }
        
    }
    func = first_class_conj[conj_name];
    var expression_value = func[bin2dec(term_values)];
    replace_expression(inner_expression, left, r_index-1, expression_value);
}

function is_var(qlelement){
    if(qlelement=='∧'||qlelement=='∨'||qlelement=='→'||qlelement=='⊕'||qlelement=='↔'){
        return false
    }
    return true;

}

function replace_expression(expression, left, right, value){
    expression.splice(left, right-left+1);
    expression.splice(left, 0, value);
}

function get_function_value(function_name, function_dim, inner_expression){
    l_index = 0;
    r_index = inner_expression.indexOf(',');
    term_values = [];

    for(var i=0;i<function_dim;i++){
        term = []
        for(j=l_index;j<r_index;j++){
            term.push(inner_expression[j]);
        }
        term_value = get_term_value(term);
        term_values.push(term_value);
        l_index = r_index + 1;
        r_index = l_index + 1;
        while(r_index<inner_expression.length&&inner_expression[r_index]!=','){
            r_index = r_index + 1;
        }
        
    }
    func = custom_conj[function_name];
    return func[bin2dec(term_values)];
}

function bin2dec(binary_array){
    binary_array.reverse();
    var decimal = 0;
    for(var i=0;i<binary_array.length;i++){
        decimal = decimal + binary_array[i] * Math.pow(2, i);
    }
    return decimal;
}

function get_term_value(term){
    // 前面有非符号
    if(term.length==1){
        if(term[0]==0||term[0]==1){
            return term[0];
        }
        else{
            return term[0].value;
        }
    }else{
        if(term[1]==0){
            return 1;
        }else if(term[1]==1)
        {
            return 0;
        }else if(term[1].value==0){
            return 1;
        }else{
            return 0;
        }
    }
}

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

//生成联结词计算函数
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

function show_message(message) {
    document.getElementById('messagelabel').innerText = message;
}


function begin() {

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
    parse_ql_expression(ql_expression);
    origin_parsed_ql_expression = parsed_ql_expression.slice(0);
    len = var_name_list.length;
    maxdec = Math.pow(2,len);
    result_truth = [];
    for(var ith=0;ith<maxdec;ith++){
        assion_value(ith, len);
        calculate(parsed_ql_expression);
        result_truth.push(parsed_ql_expression[0]);
        parsed_ql_expression = origin_parsed_ql_expression.slice(0);
    }


    // if (result_truth.indexOf(0) == -1) {
    //     show_message('永真式');
    //     tfflag = 1;
    // } else if (result_truth.indexOf(1) == -1) {
    //     show_message('永假式');
    // } else {
    //     var_value = [];
    //     for (i = 0; i < result_truth.length; i++) {
    //         if (result_truth[i] == 1) {
    //             var_value.push(dec2bin(i, var_name_list.length));
    //         }
    //     }
    //     show_message(var_value);
    // }
    show_message(result_truth);



    //calculate(parsed_ql_expression);


    //alert(ql_expression)
    //var result = get_function_value(ql_expression);
    //show_message(parsed_ql_expression[0]);
    //show_message(result_truth);
}

function check_ql_expression(pletext) {

}

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
function rp(n_array, n_len) {
    var result = [];
    var arr = [];
    for(var i = 0;i<n_array;i++){
        arr.push(i);
    }
    var cal = function(r, a, c) {
        if (c == 0) {
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

    generate_base_expression();
    generate_advance_expression();
}

function generate_base_expression(){
    var con_len = custom_conj_names.length;
    for(var i = 0; i<con_len;i++){
        var conj = custom_conj[custom_conj_names[i]];

        var rp_result = rp(2, conj.num);
        for(var j = 0;j<rp_result.length;j++){
            var expression = [];
            expression.push(new QLElement(QLETYPE.CONJ, conj.name));
            expression.push('(');
            for(var k = 0;k<conj.num;k++){
                expression.push(var_names[var_name_list[rp_result[j][k]]]);
                expression.push(',');
            }
            expression.splice(expression.length-1);
            expression.push(')');
            var truth_table = calculate_truth_table(expression);
            is_new_expression(expression, truth_table, 1);
        }
    }

}

function generate_advance_expression() {
    var con_len = custom_conj_names.length;
    var max_num = 0;

    for(var i = 0;i<con_len;i++){
        if(custom_conj[custom_conj_names[i]].num>max_num){
            max_num = custom_conj[custom_conj_names[i]].num;
        }
    }

    for (var i = 1; i <= max_num; i++) {
        for (var j = 0; j < con_len; j++) {
            var conj = custom_conj[custom_conj_names[j]];
            if (conj.num >= i) {
                var rp_result_adv = rp(base_expressions.length, i);
                var atom_var_len = conj.num - i;
                var rp_result_base = rp(2, atom_var_len);
                for (var a = 0; a < rp_result_adv.length; a++) {
                    for (var b = 0; b < rp_result_base.length; b++) {

                        var expression = assemble_expression(conj, rp_result_adv[a], rp_result_base[b]);
                        var truth_table = calculate_truth_table(expression);
                        is_new_expression(expression, truth_table, 0);
                        if(generated_expressions.length==16){
                            show_message("完全");
                        }
                    }
                }
            }

        }
    }
    if(generated_expressions.length<16){
        show_message("不完全");
    }
}



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

function is_new_expression(expression, truth_table, base){
    var dec = bin2dec(truth_table);
    if(expression_records[dec]==-1){
        var len = generated_expressions.length;
        expression_records[dec] = len;
        generated_expressions.push(expression.slice(0));
        if(base==1){
            base_expressions.push(expression.slice(0));
        }
    }

}
