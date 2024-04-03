// require modules
const express = require('express');
const morgan = require('morgan');
const ejs = require('ejs');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const tradeRoutes = require('./routes/tradeRoutes');
const mainRoutes = require('./routes/mainRoutes');
const userRoutes = require('./routes/userRoutes');

// create app
const app = express();


// configure app
let port = 7000;
let host = 'localhost';
app.set('view engine', 'ejs');

// connect to database
mongoose.connect('mongodb://127.0.0.1:27017/tradedb', { useNewUrlParser: true, useUnifiedTopology: true })
// mongoose.connect('mongodb://localhost:27017/tradedb', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        //start the server
        app.listen(port, host, () => {
            console.log('Server is running on port', port);
        });
    })
    .catch(err => console.log(err.message));

app.use(session({
    secret: 'dbwerub2843hrfjewur23818ch3gcgi1',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge:60*60*1000},
    store: new MongoStore({mongoUrl: 'mongodb://127.0.0.1:27017/tradedb'})
}));

app.use(flash());

app.use((req, res, next)=>{
    // console.log(req.session);
    res.locals.user= req.session.user||null;
    res.locals.firstName = req.session.firstName||null;
    res.locals.lastName = req.session.lastName||null;
    res.locals.successMessages = req.flash('success');
    res.locals.errorMessages = req.flash('error');
    next();
});

// mount middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.use(methodOverride('_method'));

app.use('/', mainRoutes);
app.use('/users', userRoutes);
app.use('/trades',tradeRoutes);

app.use((req, res, next) => {
    let err = new Error('The server cannot locate ' + req.url);
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    console.log(err.stack);
    if (!err.status) {
        err.status = 500;
        err.message = ("Internal Server Error");
    }
    res.status(err.status);
    res.render('error', { error: err });
});