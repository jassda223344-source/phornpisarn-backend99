const express = require('express');
app.use('/uploads', express.static('uploads'));


const SECRET = 'PHORNPISARN_SECRET';
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;


const db = new sqlite3.Database('./database.db');


// ===== DATABASE =====
db.serialize(() => {
db.run(`CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY,
username TEXT UNIQUE,
password TEXT
)`);


db.run(`CREATE TABLE IF NOT EXISTS bills (
id INTEGER PRIMARY KEY,
company TEXT,
amount REAL,
datetime TEXT,
recorder TEXT,
image TEXT,
status TEXT,
pay_type TEXT,
pay_image TEXT
)`);
});


// ===== USER SEED =====
(async()=>{
const users = [
['JOY2','08314025547788'],
['Yanisa','06602070517788'],
['Pisarn','08333855287788'],
['Ouee1','0838926475']
];
for(const [u,p] of users){
const hash = await bcrypt.hash(p,10);
db.run(`INSERT OR IGNORE INTO users VALUES(null,?,?)`,[u,hash]);
}
})();


// ===== AUTH =====
const auth = (req,res,next)=>{
try{
jwt.verify(req.headers.authorization,SECRET);
next();
}catch{
res.sendStatus(401);
}
};


// ===== LOGIN =====
app.post('/login',(req,res)=>{
const {username,password}=req.body;
db.get(`SELECT * FROM users WHERE username=?`,[username],async(_,u)=>{
if(!u) return res.sendStatus(401);
if(await bcrypt.compare(password,u.password)){
res.json({token:jwt.sign({username},SECRET)});
}else res.sendStatus(401);
});
});


// ===== ADD BILL =====
app.post('/bill',auth,upload.single('image'),(req,res)=>{
const {company,amount,datetime,recorder}=req.body;
db.run(
`INSERT INTO bills VALUES(null,?,?,?,?,?,?,?,?)`,
[company,amount,datetime,recorder,req.file?.path,'รอจ่าย',null,null],
()=>res.json({success:true})
);
});


// ===== PAY BILL =====
app.post('/bill/pay/:id',auth,upload.single('image'),(req,res)=>{
const {type}=req.body;
db.run(
`UPDATE bills SET status='จ่ายแล้ว', pay_type=?, pay_image=? WHERE id=?`,
[type,req.file?.path,req.params.id],
()=>res.json({success:true})
);
});


// ===== LIST BILL =====
app.get('/bill',auth,(req,res)=>{
db.all(`SELECT * FROM bills ORDER BY id DESC`,[],(_,r)=>res.json(r));
});


app.get('/',(req,res)=>res.send('Backend is running'));


app.listen(PORT,()=>console.log('Backend running'));
