const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.kratinCookie;
        if (token) {
            const verified = jwt.verify(token, process.env.SECRET_KEY);

            const user = await User.findById({ _id: verified });
            req.token = token;
            req.user = user;

            next();
        }
        else {
            res.json({
                success: false,
                data: "Already logged in."
            })
        }
    } catch (err) {
        res.redirect("login");
    }
}

module.exports = auth;