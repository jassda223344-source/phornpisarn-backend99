const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = 'PHORNPISARN_SECRET';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const upload = multer({ dest: 'uploads/' });
const db = new sqlite3.Database('./database.db');

// ===== DATABASE + SEED (สำคัญมาก) =====
db.serialize(async () => {
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

  // 🔥 ล้าง user เก่า (กันพัง)
  db.run(`DELETE FROM users`);

  const users = [
    ['JOY2','08314025547788'],
    ['Yanisa','06602070517788'],
    ['Pisarn','08333855287788'],
    ['Ouee1','0838926475']
  ];

  for (const [u,p] of users) {
    const hash = await bcrypt.hash(p,10);
    db.run(`INSERT INTO users (username,password) VALUES (?,?)`,[u,hash]);
  }

  console.log('Users seeded');
});

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
  const {username,password} = req.body;

  db.get(
    `SELECT * FROM users WHERE username=?`,
    [username],
    async (err,u)=>{
      if(!u) return res.status(401).json({msg:'user not found'});
      const ok = await bcrypt.compare(password,u.password);
      if(!ok) return res.status(401).json({msg:'wrong password'});
      res.json({token:jwt.sign({username},SECRET)});
    }
  );
});

// ===== TEST =====
app.get('/',(req,res)=>{
  res.send('Backend is running');
});

app.listen(PORT,()=>{
  console.log('Backend running');
});
