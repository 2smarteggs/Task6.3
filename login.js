/*
 * dependencies
 * -------------------------------------------------
 */
let express=require('express');
let bodyParser=require("body-parser");
let https=require("https");
let User=require('./dataModel.js');  //User为model name
let mongoose=require('mongoose');
let validator=require('validator');
let url=require("url");
const crypto=require("crypto");
const PATH="https://sit313-6-3.herokuapp.com";

// sign-in with passport
const passport=require("passport");
// github sign-in
const GitHubStrategy = require('passport-github2').Strategy;
// google sign-in
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// session
const session=require("express-session");
// https://sit313-6-3.herokuapp.com/resetPassword

// forget password
let nodemailer = require('nodemailer');
let smtpTransport = require('nodemailer-smtp-transport');
let config = require('./config');

// set router
let app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
// cookie
app.use(session( {
    cookie: { maxAge: 30000 }, // 30000ms = 30s
    resave: false,
    saveUninitialized: false,
    secret: '$CrowdTaskSecret'
}));
// app.use(passport.initialize());
// app.use(passport.session());

// use github
passport.use(new GitHubStrategy({
        clientID: "38c770f084b242f947a8",
        clientSecret: "1737c7706845c6b85226212f8f12220965bfc260",
        callbackURL: "https://sit313-6-3.herokuapp.com/auth/github/callback"
    },
    function(accessToken, refreshToken, profile, cb) {
        // User.findOrCreate({ githubId: profile.id }, function (err, user) {
        //     return cb(err, user);
        // });
        console.log(profile.username);
        console.log(profile.emails[0].value);
        console.log(profile.id);
    }
));

// use google
passport.use(new GoogleStrategy({
        clientID: "797962964522-l31lliqeqoqvm95vpvqe6vaav8oq34g2.apps.googleusercontent.com",
        clientSecret: "z7PZ3MT6945yW2OzcwponBXx",
        callbackURL: "https://sit313-6-3.herokuapp.com/auth/github/callback"
    },
    function(accessToken, refreshToken, profile, cb) {
        // User.findOrCreate({ googleId: profile.id }, function (err, user) {
        //     return cb(err, user);
        // });
        console.log(profile.id);
    }
));

// github login
app.get('/auth/github',
    passport.authenticate('github', { failureRedirect: '/' }, function (err) {
        console.log(err);
    }));

// google login
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }, function (err) {
        console.log(err);
    }));

// github callback
app.get('/auth/github/callback',(req,res) => {
    // Successful authentication, redirect home.
    req.session.sign = true;
    res.redirect('/myPage');
});

// google callback
app.get('/auth/google/callback',(req,res) => {
    // Successful authentication, redirect home.
    req.session.sign = true;
    res.redirect('/myPage');
});
// app.get('/auth/github/callback',
//     passport.authenticate('github', { failureRedirect: '/' }, function (err) {
//         console.log(err);
//     }),
//     function(req, res) {
//         // Successful authentication, redirect home.
//         res.redirect('/myPage');
//     });

// forget password page
app.get('/forgetPassword',(req,res) => {
    res.sendFile(__dirname+"/"+"forgetPassword.html");
});
app.post('/forgetPassword',(req,res) => {
    sendMail(req.body.myEmail, 'iCrowdTask Password Reset', '<h1>Please click the following link to reset password:</h1> <a href="https://sit313-6-3.herokuapp.com/resetPassword">https://sit313-6-3.herokuapp.com/resetPassword</a>');
    res.send("A reset Email will be sent to your account in a few minutes, It may be in the TRASH BIN also!");
});

// reset password page
app.get('/resetPassword',(req,res) => {
    res.sendFile(__dirname+"/"+"resetPassword.html");
});
app.post('/resetPassword',(req,res) => {

    // encrypt the password
    let md5=crypto.createHash("md5");
    let hashedPassword=md5.update(req.body.myPassword).digest("hex");
    console.log(hashedPassword);

    User.updateOne({"email": req.body.myEmail}, {"password": hashedPassword}, function (err, data) {
        if(err) throw err;
        if(data){
            // const returnJSON = {"status": "true"};
            // res.end(JSON.stringify(returnJSON));
            res.redirect('/');
        }else{
            // const returnJSON = {"status": "false"};
            // res.end(JSON.stringify(returnJSON));
            res.end("ERROR");
        }
    });
});

app.get('/',(req,res) => {
    if (req.session.sign) {
        console.log(req.session);
        // res.sendFile(__dirname+"/"+"reqtask.html");
        res.redirect('/myPage');
    } else {
        res.sendFile(__dirname+"/"+"login.html");
    }
});

app.get('/myPage',(req,res) => {

    if (req.session.sign) {
        console.log(req.session);
        res.sendFile(__dirname+"/"+"reqtask.html");
    } else {
        res.redirect('/');
    }

});

app.get('/registration', (req,res) => {
    res.sendFile(__dirname+"/"+"Register.html");
});

// mongo
mongoose.connect("mongodb+srv://admin_Yuming:Aa56112756@cluster0.sobtl.mongodb.net/myDatabase?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true})


/*
 * login & registration request
 * -------------------------------------------------
 */

// login
app.post('/',(req, res) => {

    let md5=crypto.createHash("md5");
    let hashedPassword=md5.update(req.body.myPassword).digest("hex");

    let postData = {
        email: req.body.myEmail,
        password: hashedPassword
    };
    User.findOne({
        email: postData.email,
        password: postData.password
    }, function (err, data) {
        if(err) throw err;
        if(data){
            // If the user have selected save password for 1 week
            if (req.body.checkbox === 'on') {
                // make cookie longer
                console.log("longer");
                req.session.cookie.maxAge = 172800000; // 2d
            }
            req.session.sign = true;
            // res.sendFile(__dirname + "/reqtask.html");
            res.redirect('/myPage');
        }else{
            // res.send('Incorrect username or password!');
            showMessage("Incorrect username or password!", res);
        }
    })
});

// registration
app.post('/registration', (req,res) => {

    let country=req.body.myCountry;
    let firstName=req.body.myFirstName;
    let lastName=req.body.myLastName;
    let email=req.body.myEmail;
    let password=req.body.myPassword;
    let address=req.body.myAddress;
    let city=req.body.myCity;
    let state=req.body.myState;
    let code=req.body.myCode;
    let number=req.body.myNumber;
    // let id=req.body.id

    let md5=crypto.createHash("md5");
    let hashedPassword=md5.update(password).digest("hex");

    let user=new User({
            country: country,
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashedPassword,
            address: address,
            city: city,
            state: state,
            code: code,
            number: number,
            // id: id
        }
    );
    user
        .save()
        .catch((err) => console.log(err));

    if (res.statusCode === 200) {
        // showMessage("Successfully Registered!\\n\\nClick the Sign In button to start up!\\n", res);
        res.redirect('/');
    } else {
        res.sendFile(__dirname + "/404.html")
    }

});



/*
 * api
 * -------------------------------------------------
 */

/* http://localhost:8080/workers
 * Retrieving, adding and removing workers
 *
 */

// Retrieving
app.get('/workers',(req,res) => {
    User.find({
    }, function (err, data) {
        if(err) throw err;
        if(data){
            res.end(JSON.stringify(data));
        }else{
            const returnJSON = {"status": "false"};
            res.end(JSON.stringify(returnJSON));
        }
    });
});

// Adding
app.put('/workers',(req,res) => {

    let urlStr = url.parse(req.url, true).query;

    // add a worker
    let country=urlStr.country;
    let firstName=urlStr.firstname;
    let lastName=urlStr.lastname;
    let email=urlStr.email;
    let password=urlStr.password;
    let address=urlStr.address;
    let city=urlStr.city;
    let state=urlStr.state;
    let code=urlStr.code;
    let number=urlStr.number;

    let md5=crypto.createHash("md5");
    let hashedPassword=md5.update(password).digest("hex");

    let user=new User({
            country: country,
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashedPassword,
            address: address,
            city: city,
            state: state,
            code: code,
            number: number,
            // id: id
        }
    );
    user
        .save()
        .catch((err) => console.log(err));

    if (res.statusCode === 200) {
        const returnJSON = {"status": "true"};
        res.end(JSON.stringify(returnJSON));
    } else {
        const returnJSON = {"status": "false"};
        res.end(JSON.stringify(returnJSON));
    }

});

// Removing
app.delete('/workers',(req,res) => {

    User.deleteMany({
    }, function (err, data) {
        if(err) throw err;
        if(data){
            const returnJSON = {"status": "true"};
            res.end(JSON.stringify(returnJSON));
        }else{
            const returnJSON = {"status": "false"};
            res.end(JSON.stringify(returnJSON));
        }
    });
});

/* http://localhost:8080/workers/:id
 * Retrieving, updating and removing a specific worker
 *
 */

// Retrieving
app.get('/workers/:id',(req,res) => {

    let id = req.params.id;

    User.find({"_id": id}, function (err, data) {
        if(err) throw err;
        if(data){
            res.end(JSON.stringify(data));
        }else{
            const returnJSON = {"status": "false"};
            res.end(JSON.stringify(returnJSON));
        }
    });
});

// Removing
app.delete('/workers/:id',(req,res) => {

    let id = req.params.id;

    User.deleteOne({"_id": id}, function (err, data) {
        if(err) throw err;
        if(data){
            const returnJSON = {"status": "true"};
            res.end(JSON.stringify(returnJSON));
        }else{
            const returnJSON = {"status": "false"};
            res.end(JSON.stringify(returnJSON));
        }
    });
});

/* http://localhost:8080/workers/:id
 * Updating a specific worker’s address and mobile phone
 *
 */

// address and mobile phone
app.put('/workers/:id',(req,res) => {

    let id = req.params.id;
    let address = (url.parse(req.url, true).query).address;
    let number = (url.parse(req.url, true).query).number;

    User.updateOne({"_id": id}, {"number": number, "address": address}, function (err, data) {
        if(err) throw err;
        if(data){
            const returnJSON = {"status": "true"};
            res.end(JSON.stringify(returnJSON));
        }else{
            const returnJSON = {"status": "false"};
            res.end(JSON.stringify(returnJSON));
        }
    });
});


/* http://localhost:8080/workers/:id
 * Updating a specific worker’s password
 *
 */

app.patch('/workers/:id',(req,res) => {

    let id = req.params.id;
    let password = (url.parse(req.url, true).query).password;

    // encrypt the password
    let md5=crypto.createHash("md5");
    let hashedPassword=md5.update(password).digest("hex");
    console.log(hashedPassword);
    // console.log(JSON.stringify(JSON.stringify(url.parse(req.url, true)["query"]).substring(1, JSON.stringify(url.parse(req.url, true)["query"]).length - 2)));


    User.updateOne({"_id": id}, {"password": hashedPassword}, function (err, data) {
        if(err) throw err;
        if(data){
            const returnJSON = {"status": "true"};
            res.end(JSON.stringify(returnJSON));
        }else{
            const returnJSON = {"status": "false"};
            res.end(JSON.stringify(returnJSON));
        }
    });
});


/*
 * server status
 * -------------------------------------------------
 */

let server = app.listen(process.env.PORT || 8080, function () {
    console.log("Server is running successfully on Heroku Yes!");
});


/*
 * functions
 * -------------------------------------------------
 */

// alert message function
function showMessage(message,res){
    let result=`<script>alert('${message}');history.back()</script>`;
    res.send(result);
}

// email sending
smtpTransport = nodemailer.createTransport(smtpTransport({
    service: config.email.service,
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
}));

let sendMail = function (recipient, subject, html) {

    smtpTransport.sendMail({

        from: config.email.user,
        to: recipient,
        subject: subject,
        html: html

    }, function (error, response) {
        if (error) {
            console.log(error);
        }
        console.log('发送成功');
    });
}

module.exports = sendMail;
