const express = require('express')
const router = express.Router()
const User = require("../models/user");
const auth = require("../middleware/auth")
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const dotenv = require("dotenv");
const path = require('path')
dotenv.config({path:path.join(__dirname, "../../config.env")});

mongoose.connect("mongodb://localhost:27017/kratin", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
});

// const OAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI)
// // console.log(OAuth2Client, "Hii")
// OAuth2Client.setCredentials({refresh_token: process.env.REFRESH_TOKEN});
// // console.log(OAuth2Client, "Ding")
// console.log(OAuth2Client.getAccessToken())

router.get("/", (req, res) => {
    res.status(200).render("home");
});


router.get("/about", (req, res) => {
    res.status(200).render("about");
});


router.get("/contact", (req, res) => {
    res.status(200).render("contact");
});


router.get("/main", auth, (req, res)=>{
    const meds = getMeds(req);
    const day = getDay();
    console.log(day)
    const setToday = {1 : ['Monday', false], 2 : ['Tuesday', false], 3 : ['Wednesday', false], 4 : ['Thursday', false], 5 : ['Friday', false], 6 : ['Saturday', false], 0 : ['Sunday', false]};
    setToday[day][1] = true;

    res.status(200).render("main", {meds : meds, setToday: setToday});
})

router.post("/main", auth, async (req, res)=>{
    try {
        const user = req.user;

        user.medicines.push(req.body);
        await user.save();

        res.redirect("/main")
    } catch (error) {
        res.json({
            success:false,
            error: error.toString()
        })
    }
});

router.post("/taken", auth, async (req, res)=>{
    try {
        const user = req.user;
        for(let doc of user.medicines){
            if(doc._id.toString() === req.body.docId){
                if(doc.stock > 0 && doc.dosage <= doc.stock) doc.stock -= doc.dosage;
            }
        }
        await user.save();

        res.redirect("/main");
    } catch (error) {
        res.json({
            success:false,
            error: error.toString()
        })
    }
})

router.get("/sos", auth, async (req, res)=>{
    try {
        await sendMailUsingOAuth(req);
        res.json({
            sucess: true,
            data: 'Email Sent Successfully. Help will reach you soon.'
        })
    } catch (err) {
        res.json({
            success:false,
            err:err,
            data: 'Failed to Send SOS'
        })
    }
})

router.get("/register", (req, res) => {
    res.status(200).render("register");
});


router.post("/register", async (req, res) => {
    try {
        const user_mail = await User.findOne({ email: req.body.email })
        if (user_mail) {
            throw new Error("Email already in use");
        }

        const user_to_register = User(req.body);
        await user_to_register.save();

        const token = await user_to_register.generateAuthToken();
        res.cookie("kratinCookie", token, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        res.redirect("/main");
    } catch (err) {
        console.log(err)
        res.redirect("/register");
    }
});


router.get("/login", (req, res) => {
    res.status(200).render("login");
});


router.post("/login", async (req, res) => {
    try {
        if (res.locals.isAuthenticated) {
            res.json({
                success: false,
                data: "Already logged in."
            })
        }
        else {
            const user = await User.findOne({ email: req.body.email });
            if (user && user.password === req.body.password) {
                const token = await user.generateAuthToken();

                res.cookie("kratinCookie", token, {
                    expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
                });

                res.redirect("/main");
            }
            else {
                throw new Error("Invalid Login Credentials.");
            }
        }
    } catch (err) {
        console.log(err)
        res.json({
            success: false,
            error: err
        })
    }
});


router.get("/logout", auth, async (req, res) => {
    try {
        if (req.token) {
            res.clearCookie("kratinCookie");
            res.redirect("/login");
        }
        else {
            throw new Error("Login to access this feature.");
        }
    } catch (err) {
        res.redirect("/login");
    }
});


router.get("*", (req, res) => {
    res.status(404).json({
        "sucess": false,
        "body": "Page Not Found"
    })
});



const getMeds = (req)=>{
    const user = req.user;
    return user.medicines;
}

const getDay = ()=>{
    return new Date().getDay();
}

const sendMailUsingOAuth = async (req) => {
    const msg = {
        from: 'darkluciferpg@gmail.com',
        to: req.user.sos_email,
        subject: `Emergency message from ${req.user.email}`,
        text: 'Hi there this is emergency message. Someone needs your help.Kindly reach them as fast as you can.'
    };

    nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        },
        port: 465,
        host: 'smtp.gmail.com'
    })

    .sendMail(msg)
}


module.exports =  router