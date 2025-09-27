const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const userRoute = require('./routes/user');
const postRoute = require('./routes/post')
const cookieParser = require('cookie-parser');
const { checkForAuthenticationCookie } = require('./middlewares/authentication');
const Post = require('./models/post');

const PORT = 3000;

mongoose.connect('mongodb://localhost:27017/Blogpost').then(e => console.log('mongoose is connected'));

app.set('view engine', "ejs");
app.set('views', path.resolve("./views"));

app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve('./public')));


app.get('/',async (req, res) => {
    const allPost = (await Post.find({visibility: 'true'}).populate("createdBy", "fullName profileUrl"))
    return res.render('home', {
        user: req.user,
        posts: allPost,
    })
});
app.use('/user', userRoute);
app.use('/post', postRoute);



app.listen(PORT, () => console.log(`Server is started at: ${PORT}`));