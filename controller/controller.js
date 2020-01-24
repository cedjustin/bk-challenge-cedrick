// importing dependencies
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const moment = require('moment');



// configuring the db
const client = new Client({
    connectionString: process.env.Database_url,
    ssl: true,
});




// connecting to the database
client.connect().then(() => console.log('db connected')).catch(e => console.log(e));

// start of controllers

let _getTimeStamp = async () => {
    return moment().format();
}

// function for checking if the user exists and SignIn
module.exports.signInController = async (username, password) => {
    username = username.toLowerCase().trim();
    password = password.trim();
    let response;
    query = 'SELECT COUNT(1) FROM users WHERE username=$1';
    values = [username];
    await client.query(query, values).then(async res => {
        if (res.rows[0].count == 1) {
            getUserQuery = 'SELECT id,username,password FROM users WHERE username=$1';
            getUserValues = [username]
            await client.query(getUserQuery, getUserValues).then(async res => {
                if (res.rows.length <= 0) {
                    response = {
                        error: 1,
                        message: 'there are no users'
                    }
                } else {
                    const hashedpassword = res.rows[0].password
                    const passwordMatch = bcrypt.compareSync(password, hashedpassword);
                    if (passwordMatch) {
                        response = {
                            error: 0,
                            message: 'proceed',
                            data: {
                                id: res.rows[0].id,
                                username: res.rows[0].username
                            }
                        }
                    } else {
                        response = {
                            error: 1,
                            message: "Username or password is incorrect",
                            username: username
                        };
                    }
                }
            }).catch(e => {
                response = {
                    error: 1,
                    message: '404'
                }
            });
        } else {
            response = {
                error: 1,
                message: "Username or password is incorrect",
                username: username
            };
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "404"
        };
        console.log(e);
    });
    return response
}

// a function to add a new user
module.exports.signUpController = async (username, password) => {
    username = username.toLowerCase().trim();
    password = password.trim()
    let response;
    query = 'SELECT COUNT(1) FROM users WHERE username=$1';
    values = [username];
    await client.query(query, values).then(async res => {
        if (res.rows[0].count == 1) {
            response = {
                error: 1,
                message: 'Username already in use'
            };
        } else {
            var hash = bcrypt.hashSync(password, saltRounds);
            let insertQuery = {
                text: 'INSERT INTO users(username,password) VALUES ($1,$2) RETURNING *',
                values: [username, hash]
            }
            await client.query(insertQuery).then(async res => {
                response = {
                    error: 0,
                    message: 'Proceed',
                    data: {
                        id: res.rows[0].id,
                        username: res.rows[0].username
                    }
                }
            }).catch(e => {
                console.log(e);
                response = {
                    error: 1,
                    message: "404"
                };
            })
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "404"
        };
        console.log(e);
    });
    return response
}

const checkIfProductExists = async (name, price) => {
    let response
    query = 'SELECT COUNT(1) FROM products WHERE name=$1 AND price=$2';
    values = [name, price];
    await client.query(query, values).then(async res => {
        if (res.rows[0].count == 1) {
            response = true
        } else {
            response = false
        }
    }).catch(e => {
        console.log(e);
    })
    return response;
}

// function to add a post or product
module.exports.addProductController = async (name, price) => {
    getTimeStamp = await _getTimeStamp();
    name = name.trim();
    let response;
    let postExists = await checkIfProductExists(name, price);
    if (postExists) {
        response = {
            error: 1,
            message: 'product arleady exist'
        }
    } else {
        let insertQuery = {
            text: 'INSERT INTO products(name, price, timestamp) VALUES ($1,$2,$3) RETURNING *',
            values: [name, price, getTimeStamp]
        }
        await client.query(insertQuery).then(async res => {
            response = {
                error: 0,
                message: 'Proceed',
                data: res.rows
            }
        }).catch(e => {
            console.log(e)
            response = {
                error: 1,
                message: "404"
            };
        })
    }
    return response;
}


// function to get all products
module.exports.getProductsController = async (offset) => {
    let response;
    getPostsQuery = {
        text: 'SELECT name,price,timestamp FROM products ORDER BY name ASC OFFSET $1 FETCH FIRST 10 ROWS ONLY',
        values: [offset]
    }
    await client.query(getPostsQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no products'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' products',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}