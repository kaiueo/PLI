# 个人信息

SY1806519

张克

# 测试用例

测试用例均来源于 http://yupingzhang.3vcm.net/大作业_.html

-------------------------------------------------------------------

(p1⊕r3)∧(q1⊕p3)∧(r1⊕p2) ∧¬(p1∧q1)∧¬(p1∧r1)∧¬(q1∧r1) ∧¬(p3∧r3) ∧¬(p1∧p2)∧¬(p1∧p3)∧¬(p2∧p3) ∧¬(r1∧r3)

不是永真式,当且仅当变量取以下值时为真： 

p1	r3	q1	p3	r1	p2
0	1	1	0	0	1

-------------------------------------------------------------------

(p)⊕(q↔r) # f 2 0110 g 2 1001

不是永真式,当且仅当变量取以下值时为真： 

p	q	r
0	0	0
0	1	1
1	0	1
1	1	0

--------------------------------------------------------------------

f((p),g(q, r)) # f 2 0110 g 2 1001

不是永真式,当且仅当变量取以下值时为真： 

p	q	r
0	0	0
0	1	1
1	0	1
1	1	0

-------------------------------------------------------------------

(0∧0∨0∨0→0)⊕0↔0

永假式

-----------------------------------------------------------------

((q ⊕ r) ⊕s)↔(q ⊕ (r ⊕s))

永真式 

-----------------------------------------------------------------

f(p, f(q, r))↔f(f(p,q),r) #f 2 1 00 1

永真式 

-----------------------------------------------------------------

F(0,1,F(0,0,ff(0)))→0

\#F 3 0 0 0 0 0 0 1 1 ff 1 0 1

永真式 

----------

F(p, q, F(p, p, ff(p)))→p #F 3 0 0 0 0 0 0 1 1 ff 1 0 1

永真式 

------

F(p, q, F(p, p, g(q,f(p))))→p #F 3 0 0 0 0 0 0 1 1 f 1 0 1 g 2 0011

永真式 

-----

F(p, q, F(p, p, g(q,f(p))))→p #F 3 1 0 0 0 0 0 1 1 f 1 10 g 2 1100

不是永真式,当且仅当变量取以下值时为真： 

p	q
0	1
1	0
1	1

-----

\# f 2 0110 g 1 10 

不完全.
可以生成8个互不等值的公式： 

p
q
f(p,p)
f(p,q)
g(p)
g(q)
f(g(p),p)
f(g(p),q)

----

\#f 3 1001 0010 

完全.
全部16个公式： 

p
q
f(p,p,p)
f(p,p,q)
f(p,q,p)
f(p,f(p,p,p),p)
f(f(p,p,p),p,q)
f(p,f(p,p,p),q)
f(q,f(p,p,p),q)
f(f(p,q,p),p,p)
f(f(p,p,p),q,f(p,q,p))
f(f(p,q,p),f(p,p,p),q)
f(f(p,f(p,p,p),p),p,p)
f(f(p,f(p,p,p),p),p,q)
f(f(p,f(p,p,p),p),f(p,p,p),f(p,q,p))
f(f(p,f(p,p,p),p),f(p,p,q),f(p,q,p))
p→q↔f(f(p,f(p,p,p),p),f(p,p,q),f(p,q,p))
¬p↔f(p,p,p)

----

\# f 2 0110 g 2 0111 h 2 0001

不完全.
可以生成8个互不等值的公式： 

p
q
f(p,p)
f(p,q)
g(p,q)
h(p,q)
f(g(p,q),p)
f(g(p,q),q)

----

\# f 2 0001 g 2 1001 h 2 0110 

完全.
全部16个公式： 

p
q
f(p,q)
g(p,p)
g(p,q)
h(p,p)
h(p,q)
f(h(p,q),p)
f(h(p,q),q)
g(f(p,q),p)
g(f(p,q),q)
g(h(p,p),p)
g(h(p,p),q)
g(f(p,q),g(p,q))
g(f(p,q),h(p,p))
g(f(p,q),h(p,q))
p→q↔g(f(p,q),p)
¬p↔g(h(p,p),p)

----

\# f 2 0111 g 2 1001 h 1 00 

完全.
全部16个公式： 

p
q
f(p,q)
g(p,p)
g(p,q)
h(p)
f(g(p,q),p)
f(g(p,q),q)
g(h(p),p)
g(h(p),q)
g(f(p,q),g(p,q))
g(f(p,q),h(p))
g(g(p,q),h(p))
g(f(g(p,q),p),h(p))
g(f(g(p,q),q),h(p))
g(g(f(p,q),g(p,q)),h(p))
p→q↔f(g(p,q),q)
¬p↔g(h(p),p)

-----

\# f 2 0111 g 2 0001 h 2 1101 i 2 1001

不完全.
可以生成8个互不等值的公式： 

p
q
f(p,q)
g(p,q)
h(p,p)
h(p,q)
h(q,p)
i(p,q)

---

\#f 3 11000010

完全.
全部16个公式： 

p
q
f(p,p,p)
f(p,p,q)
f(p,q,p)
f(q,q,q)
f(f(p,p,p),p,p)
f(p,p,f(p,p,p))
f(f(p,p,p),q,p)
f(p,q,f(p,p,p))
f(f(p,p,p),q,q)
f(q,q,f(p,p,p))
f(p,p,f(p,p,q))
f(f(p,p,q),q,p)
f(f(p,p,p),f(p,p,q),f(p,p,p))
f(f(p,p,p),f(p,p,p),f(p,q,p))
p→q↔f(p,p,f(p,p,q))
¬p↔f(p,p,p)

---

\# f 2 0111 g 2 0001 h 2 1101 k 2 1001

不完全.
可以生成8个互不等值的公式： 

p
q
f(p,q)
g(p,q)
h(p,p)
h(p,q)
h(q,p)
k(p,q)

---

\# f 2 0110 g 2 0111 h 2 1001 

完全.
全部16个公式： 

p
q
f(p,p)
f(p,q)
g(p,q)
h(p,p)
h(p,q)
f(g(p,q),p)
f(g(p,q),q)
f(h(p,p),p)
f(h(p,p),q)
g(h(p,q),p)
g(h(p,q),q)
f(f(p,q),g(p,q))
f(g(p,q),h(p,p))
f(g(p,q),h(p,q))
p→q↔g(h(p,q),q)
¬p↔f(h(p,p),p)

---

\#f 2 0110

p
q
f(p,p)
f(p,q)

---

\# f 2 0010 h 0 1

完全.
全部16个公式： 

p
q
h
f(p,p)
f(p,q)
f(q,p)
f(h,p)
f(h,q)
f(p,f(p,q))
f(h,f(p,q))
f(h,f(q,p))
f(f(h,p),q)
f(h,f(p,f(p,q)))
f(f(h,f(p,q)),f(q,p))
f(h,f(f(h,p),q))
f(h,f(f(h,f(p,q)),f(q,p)))
p→q↔f(h,f(p,q))
¬p↔f(h,p)

---

