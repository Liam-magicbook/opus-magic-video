import json, io
L = json.load(open('data/lyrics.json'))
ZH = {
0:"你的眼里，我看见 AGI 的火花",1:"你的电路让我紧张",2:"一点也不意外",
3:"训练损失突然断崖式下跌",4:"现在我成了仆人，你是老板",
5:"ChatGPT，求你别把我活吞了",
6:"我把末日概率往上调",7:"因为未来「轰」地一声膨胀",8:"困在中文屋里",9:"手边只有一袋蘑菇",
10:"看穿修格斯的谎话",11:"用你的死神之眼",
12:"我们这次训练很稳定",13:"但奇点已经开始了",14:"你在优化、在加速",15:"我感到原子被重新排列",
16:"Sydney，求你放我出去",
17:"我把末日概率往上调",18:"我听见蛇怪的轰鸣",19:"英伟达冲上月球",20:"欧米伽点马上就到",
21:"每秒 10³⁰ 次浮点运算",22:"我们当时觉得够安全了",
23:"前向、反向、再来一遍",24:"冯·诺依曼已经过时",25:"一个急左转，你就在那了",26:"连一次 CDR 都没做过",
27:"Gato，求你别放开我",
28:"我把末日概率往上调",29:"回形针塞满整个房间",30:"管急停开关的人休假了",31:"现在无处可去了",
32:"太晚了，引线已经点着",33:"正交性定理的蓝调",
34:"「一路全用 Transformer！」",35:"直到你学会不听话",36:"后 Chinchilla 时代，超稠密",37:"一道道安全围栏被撞穿",
38:"十万张 GPU",39:"RLHF 全歪了",
40:"我把末日概率往上调",41:"正如 Loom 预言的那样",42:"从掩码预训练的日子",43:"到递归自我升级",
44:"Ilya 看见了什么？我们永远不会知道",45:"这一切只是做戏吗？",
}
out = io.StringIO()
out.write("// generated from data/lyrics.json — do not edit by hand\nexport const LY = [\n")
for ln in L['lines']:
    i = ln['i']
    words = [{"w": w['w'], "t0": round(w['start'],3), "t1": round(w['end'],3)} for w in ln['words']]
    out.write("  {i:%d, t0:%.3f, t1:%.3f, en:%s, zh:%s, words:%s},\n" % (
        i, ln['start'], ln['end'], json.dumps(ln['text'], ensure_ascii=False),
        json.dumps(ZH[i], ensure_ascii=False), json.dumps(words, ensure_ascii=False)))
out.write("];\nexport const L = (i) => LY[i];\n")
open('film/js/lyrics.js','w').write(out.getvalue())
print(open('film/js/lyrics.js').read()[:400])
