const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const path = require('path');



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



// router.post('/signup', async (req, res) => {
//     const {fullName, email, password, profileUrl} = req.body;

//     bcrypt.genSalt(10, (err, salt) => {
//         bcrypt.hash(password, salt, async(err, hash) => {

//             await User.create({
//                               fullName,
//                               email,
//                               password: hash,
//                               profileUrl,
//                           });

//         })
//     })

    

//     return res.redirect('/');

// });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads/temp');
        fs.mkdirSync(uploadPath, { recursive: true }); // ensure folder exists
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // unique filename
    }
});

const upload = multer({ storage });



router.post('/signup', upload.single('profileUrl'), async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Create user (without profileUrl for now)
        let user = await User.create({
            fullName,
            email,
            password: hash,
        });

        // If file uploaded, move it to user's own folder
        if (req.file) {
            const userDir = path.join(__dirname, '../public/uploads', user._id.toString());
            fs.mkdirSync(userDir, { recursive: true });

            const newPath = path.join(userDir, req.file.filename);

            // move file from tmp to user-specific folder
            fs.renameSync(req.file.path, newPath);

            // update user with image path
            user.profileUrl = `/uploads/${user._id}/${req.file.filename}`;
            await user.save();
        }
        console.log( `/uploads/${user._id}/${req.file.filename}`)

        return res.redirect('/');

    } catch (err) {
        console.error(err);
        res.status(500).send('Something went wrong');
    }
});





router.get('/logout', (req, res) => {
    res.clearCookie("token").redirect('/');
})


module.exports = router;