// importing dependencies
const express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
var config = require('../config');
const {
    signInController,
    signUpController,
    addProductController,
    getProductsController
} = require('../controller/controller')


// a function to check if the backend is working
router.get('/', (req, res) => {
    return res.json({
        error: 0,
        message: 'you have reached the backend'
    })
})

// a function to check if token hasn't expired
router.get('/token-checker', verifyToken, (req, res) => {
    return res.json({
        error: 0,
        message: 'proceed'
    })
})


router.post('/login', [
    check('username').exists().withMessage('You must provide a username'),
    check('password').exists().withMessage('You must provide a password'),
], async (req, res) => {

    // validating data
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(JSON.stringify(errors.array()));
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        username = req.body.username
        password = req.body.password
        // when everything is okay
        await signInController(username, password)
            .then(response => {
                if (response.error == 0) {
                    jwt.sign({ user: response.data }, config.id, { expiresIn: '10h' }, (err, token) => {
                        res.json({
                            token,
                            response
                        })
                    })
                } else {
                    return res.status(200).json({ response });
                }
            }).catch(e => console.log(e));
    }
});

// signup route
router.post('/signup', [
    check('username').exists().withMessage('You must provide a username').isString().withMessage('username must be characters, ABC'),
    check('password').exists().withMessage('You must provide a password').isLength({ min: 5 }).withMessage('must be at least 5 chars long')
        .matches(/\d/).withMessage('must contain a number'),
    check('cpassword').exists().withMessage('You must provide a password').isLength({ min: 5 }).withMessage('must be at least 5 chars long')
        .matches(/\d/).withMessage('must contain a number')
], (req, res) => {
    // deformating all data
    username = req.body.username
    password = req.body.password
    cPassword = req.body.cpassword
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(JSON.stringify(errors.array()));
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else if (password != cPassword) {
        return res.status(403).json({ message: "the passwords doesn't match" });
    } else {
        signUpController(username, password).then(response => {
            if (response.error == 0) {
                jwt.sign({ user: response.data }, config.id, { expiresIn: '10h' }, (err, token) => {
                    res.json({
                        token,
                        response
                    })
                })
            } else {
                return res.status(200).json({ response });
            }
        });
    }
})

// add a new product 
router.post('/add-product', verifyToken, [
    check('name').exists().withMessage('You must provide a product name'),
    check('price').exists().withMessage('You must provide the price of the product'),
    check('userid').exists().withMessage('You must provide the userid of the user who added the product'),
    check('details').exists().withMessage('You must provide the details of a product'),
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { name, price, userid, details } = req.body;
        // when everything is okay
        await addProductController(name, price, userid, details).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});


// get posts 
router.get('/get-products', async (req, res) => {

    // deconstracting data
    const { offset} = req.headers;

    // when everything is okay
    await getProductsController(offset).then(response => {
        return res.json({ response })
    })
});


// verify token
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    // check if bearer is undefined
    if (typeof bearerHeader !== undefined) {
        //split at the space
        const bearer = bearerHeader.split(' ');
        // get token from array
        const token = bearer[1];
        jwt.verify(token, config.id, (err, authData) => {
            if (err) {
                res.json({
                    error: 1,
                    status: 403,
                    message: 'you are lost'
                })
            } else {
                next();
            }
        })
    } else {
        res.json({
            error: 1,
            status: 403,
            message: 'you are lost'
        })
    }
}

module.exports = router;