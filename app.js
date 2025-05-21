const express = require('express');
const app = express();
const userModel = require("./models/user"); 
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');



app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());




const isLoggedIn = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).send("You must be logged in");
    }

    try {
        const data = jwt.verify(token, "shhhh");
        req.user = data;
        next(); // move to next middleware or route
    } catch (err) {
        return res.status(403).send("Invalid or expired token");
    }
};



app.get("/", (req, res)=>{
    res.render("index");
})
app.get("/login", (req, res)=>{
    res.render("login");
})

app.get("/profile", isLoggedIn, (req, res)=>{
    console.log(req.user);
    res.render("login");
})

app.post('/register', async (req, res) => {
    let {email, password, username, name, age} = req.body;

    let user = await userModel.findOne({email}); //database me data daalne se pehle ye check karenge agar ki same email se aur koi user created hai ya nhi

    if(user){
        return res.status(500).send("User is already registered"); // user pehle se hai to usko re register nhi karenge :)
    }
    bcrypt.genSalt(10, (err,salt) =>{
        //isse ek random salt create hota hai jisse hamara password hash hoga
        bcrypt.hash(password, salt, async (err, hash) =>{
            //password hash kr lia gaya hai
            //abb isko db me daalenge 
            let user = await userModel.create({
                username,
                email,
                age,
                name,
                password: hash
            });

            //hume token cookie me save krwa dena hota hai
            let token = jwt.sign({email: email, userid: user._id}, "shhhh");
            res.cookie("token" , token); 
            res.send("registered");

        })
    })



})

app.post('/login', async (req, res) => {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });

    if (!user) {
        return res.status(500).send("Something went wrong");
    }

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
            res.cookie("token", token); // ✅ Set cookie first
            res.status(200).send("you can login"); // ✅ Then send response
        } else {
            res.redirect("/login");
        }
    });
});

app.get("/logout" , (req, res) => {
    //ye cookie clear krne ke liye
    res.cookie("token", "");
    res.redirect("/login");
})



app.listen(3000);