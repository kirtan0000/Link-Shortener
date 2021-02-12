const express = require('express');
const app = express();
var mysql = require('mysql');
const bodyParser = require('body-parser');
const generateUniqueId = require('generate-unique-id');
const enviromentVars = require('dotenv').config().parsed;
process.env.NODE_ENV = 'production';

var config = {
    connectionLimit: 120,
    user: enviromentVars.USER.toString(),
    password: enviromentVars.PASSWORD.toString(),
    database: enviromentVars.DATABASE.toString()
};

var con = mysql.createPool(config);

app.use(bodyParser.urlencoded({
    extended: true
}));

// Validate the url
const validURL = str => {
    var pattern = new RegExp('^(https?:\\/\\/)?' +
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
        '((\\d{1,3}\\.){3}\\d{1,3}))' +
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
        '(\\?[;&a-z\\d%_.~+=-]*)?' +
        '(\\#[-a-z\\d_]*)?$', 'i');
    return !!pattern.test(str);
};

app.get('/', (req, res) => {

    res.sendFile(__dirname + "/html/index.html")

});

app.get('/:id', (req, res) => {

    con.getConnection(function(err, tempCont) {
        if (err) res.send(err);
        con.query(`SELECT * FROM links WHERE id='${req.params.id}'`, function(err, result, fields) {
            if (err) res.send('Could Not Find URL');
            else if (result.toString()) {

                res.send(`<script> location.replace("${result[0].linkPath}"); </script>`);

            } else res.send('Could Not Find URL');
            tempCont.release();
        });
    });

});

app.post('/api/add_link', (req, res) => {
    let resID = generateUniqueId({
        length: 19
    });
    if (req.body.link && validURL(req.body.link)) {
        con.getConnection(function(err, tempCont) {
            if (err) res.send(err);
            con.query(`SELECT * FROM links WHERE id='${resID}'`, function(err, result, fields) {
                if (result) console.log(result.toString());
                if (err) res.json({
                    success: false
                });
                else {
                    let link = req.body.link;
                    // Check if the link contains an http/https protocol
                    if (!/^https?:\/\//i.test(link)) {
                        link = `http://${link}`;
                    }
                    con.getConnection(function(err, tempCont) {
                        let sql = `INSERT INTO links (linkPath, id)
        VALUES ("${link}", "${resID}");`;
                        con.query(sql, function(err, result) {
                            if (err) res.json({
                                success: false
                            })
                            else res.json({
                                success: true,
                                id: resID
                            });
                        });
                        tempCont.release();
                    });
                }
                tempCont.release();
            });
        });

    } else {
        res.send("error");
    }
})

app.listen(3001, () => {
    console.log(`App listening at http://localhost:3001`);
});