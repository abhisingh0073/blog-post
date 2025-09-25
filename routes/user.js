const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');



const router = express.Router();

router.get('/login', (req, res) => {
    return res.render("login");
})

router.get('/signup', (req, res) => {
    return res.render("signup");
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let token;
    try{
        token = await User.matchPasswordAndGenerateToken(email, password);
    } catch(error){
        return res.render('login', { error: 'Incorrect Email or Password '});
    }

    return res.cookie('token', token).redirect('/');
});



router.post('/signup', async (req, res) => {
    const {fullName, email, password, profileUrl} = req.body;

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async(err, hash) => {

            await User.create({
                              fullName,
                              email,
                              password: hash,
                              profileUrl,
                          });

        })
    })

    

    return res.redirect('/');

});



router.get('/logout', (req, res) => {
    res.clearCookie("token").redirect('/');
})


module.exports = router;