const Users = require('../models/user');

const auth = {
    "verify": (req, res, next) => {
        var username = (req.url).split('/')[2]; 
        console.log(`Path is ${username}`)
        Users.getUser({userName:username,status:1},(err, result)=>{
            if(err){
                //console.log(`Error is ${err}`)
                next();
            }else if(!result){
                req.logout();
                req.flash("error", "Unauthenticated");
                res.redirect("/login");
            }else{
                next();
            }
        })
    }
}

module.exports = auth;