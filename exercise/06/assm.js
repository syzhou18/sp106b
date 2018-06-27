var fs = require('fs');//載入node.js的檔案系統模組
var c = console;
var file = process.argv[2];//返回第3個才是參數
var symnew = 16;

var dtable = {
    ""   :0b000,  "M"  :0b001,  "D"  :0b010,
    "MD" :0b011,  "A"  :0b100,  "AM" :0b101,
    "AD" :0b110,  "AMD":0b111
  }
  
  var jtable = {
    ""   :0b000,  "JGT":0b001,  "JEQ":0b010,
    "JGE":0b011,  "JLT":0b100,  "JNE":0b101,
    "JLE":0b110,  "JMP":0b111
  }
  
  var ctable = {
    "0"   :0b0101010,  "1"   :0b0111111,  "-1"  :0b0111010,
    "D"   :0b0001100,  "A"   :0b0110000,   "M"   :0b1110000,
    "!D"  :0b0001101,  "!A"  :0b0110001,   "!M"  :0b1110001,
    "-D"  :0b0001111,  "-A"  :0b0110011,  "-M"  :0b1110011,
    "D+1" :0b0011111,  "A+1" :0b0110111,  "M+1" :0b1110111,
    "D-1" :0b0001110,  "A-1" :0b0110010,  "M-1" :0b1110010,
    "D+A" :0b0000010,  "D+M" :0b1000010,  "D-A" :0b0010011,
    "D-M" :0b1010011,  "A-D" :0b0000111,  "M-D" :0b1000111,
    "D&A" :0b0000000,  "D&M" :0b1000000,  "D|A" :0b0010101,
    "D|M" :0b1010101
  }
  
  var symTable = {
    "R0"  :0,  "R1"  :1,  "R2"  :2,
    "R3"  :3,  "R4"  :4,  "R5"  :5,
    "R6"  :6,  "R7"  :7,  "R8"  :8,
    "R9"  :9,  "R10" :10,  "R11" :11,
    "R12" :12,  "R13" :13,  "R14" :14,
    "R15" :15,  "SP"  :0,  "LCL" :1,
    "ARG" :2,  "THIS":3,   "THAT":4,
    "KBD" :24576,  "SCREEN":16384
  };

  

  
  totext(file+'.asm',file+'.hack');
  
  function totext(asmFile, objFile){// asm是輸入檔 hakc是輸出檔
      var text = fs.readFileSync(asmFile, "utf8");// 讀取檔案到 text 轉成字串
      var lines = text.split(/\r?\n/);//分割成一行一行 \n,\r都是換行字元 mac,linux是\n windows是\r\n
      c.log(JSON.stringify(lines,null,2));//JSON.stringify(value[, replacer[, space]]) 使用2個空格縮進
      part1(lines);
      part2(lines, objFile);
  }

  function parse(line, i){
      line.match(/^([^\/]*)(\/.*)?$/);//匹配註解符號
      line = RegExp.$1.trim();//trim()移除空白
    if(line.length===0)//空行傳回 null
        return null;
    if(line.startsWith("@")){
        return {type:"A",arg:line.substring(1).trim()};//第0個是@ 從第1個開始傳回字串
    }else if(line.match(/^\(([^\)]+)\)$/)){// ^開頭 \跳開字元 [^]裡的^代表不要 $結束
        return {type:"S",symbol:RegExp.$1};
    }else if(line.match(/^((([AMD]*)=)?([AMD01\+\-\&\|\!]*))(;(\w*))?$/)){
        return {type:"C",c:RegExp.$4,d:RegExp.$3,j:RegExp.$6,};
    };
  }

function intTostring(num, size, radix){//數字轉字串
    var  s = num.toString(radix) + "";
    while(s.length < size) s = "0" + s; //補0
    return s;
}

function addSymbol(symbol){//加入新的符號
    symTable[symbol] = symnew;
    symnew ++;
}

function code(p){
    var address;
    if(p.type==="A"){
        if(p.arg.match(/^\d+$/)){//如果@後是數字
            address = parseInt(p.arg);//parseInt()字串轉數字
        }else{
            address = symTable[p.arg];
            if(typeof address==='undefined'){//如果找不到符號,加入新符號並取位址
                address = symnew;
                addSymbol(p.arg,address);
            }
        } return address;  
    }
    else{
        var d = dtable[p.d];
        var c = ctable[p.c];
        var j = jtable[p.j];
        return 0b111<<13|c<<6|d<<3|j;//111位移13位 cx位移6位 d位移3位 
    }
}
 


function part1(lines){
    c.log("===========part1===========")
    var address = 0;
    for(var i = 0;i<lines.length;i++){
    var p = parse(lines[i], i);
    if(p===null)continue;
    if(p.type==="S"){//如果是符號,加到符號表紀錄位址
        c.log("%s:symbol:%s %s",intTostring(i+1,3,10),p.symbol,intTostring(address,4,10));
        symTable[p.symbol] = address;
        continue;
    }
    else c.log("p:%j",p);//ex: p: {"type":"C","c":"A","d":"D","j":""}

    c.log("%s:%s %s",intTostring(i+1,3,10),intTostring(address,4,10),lines[i]);//ex: 008:0000 @2
    address++;
    }
}

function part2(lines, objFile){
    c.log("===========part2===========");
    var ws = fs.createWriteStream(objFile);//創造輸出檔 ex:Add.hack
    ws.once("open",function(fd){
        var address = 0;
        for(var i=0;i<lines.length;i++){
            var p = parse(lines[i], i);
            if(p===null||p.type==="S")continue;
            c.log("%s:%s %s",intTostring(i+1,3,10),intTostring(code(p),16,2),lines[i]);
            ws.write(intTostring(code(p),16,2)+"\n");
            address++
        }
        ws.end();
    });
}
