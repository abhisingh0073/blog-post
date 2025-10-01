const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const userRoute = require('./routes/user');
const postRoute = require('./routes/post')
const cookieParser = require('cookie-parser');
const { checkForAuthenticationCookie } = require('./middlewares/authentication');
const Post = require('./models/post');
const User = require('./models/user');

const PORT = 3000;

mongoose.connect('mongodb://localhost:27017/Blogpost').then(e => console.log('mongoose is connected'));

app.set('view engine', "ejs");
app.set('views', path.resolve("./views"));

app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve('./public')));


app.get('/',async (req, res) => {
    const allPost = (await Post.find({visibility: 'true'}).populate("createdBy", "fullName profileUrl").sort({ createdAt: -1 }));
    let message = "";
    return res.render('home', {
        user: req.user,
        posts: allPost,
        message, 
    })
});
app.get('/author/:id',async (req, res) => {
    const authorId = req.params.id
    const author = await User.findById(authorId);
    const authorPost = await Post.find({createdBy: authorId, visibility: true})

    return res.render('authorPost', {
        authorpost: authorPost,
        author: author,
        user: req.user,
    })
});

app.get('/profile/:id', async (req, res) => {
    const id = req.params.id
    const profileData = await User.findById(id);
    const post = (await Post.find({createdBy: id}).sort({createdAt: -1}));

    return res.render('authorprofile',{
        author: profileData,
        authorpost: post,
        user: req.user,
    })
});
app.use('/user', userRoute);
app.use('/post', postRoute);



app.listen(PORT, () => console.log(`Server is started at: ${PORT}`));