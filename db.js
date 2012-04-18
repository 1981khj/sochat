var mongo = require("mongoskin");
var db = module.exports = {
    mongoUrl: "mongodb://admin:admin@ds031637.mongolab.com:31637/servicelog?auto_reconnect",    
    saveMessage: function(msg) {
        var db = mongo.db(this.mongoUrl);
        var messageCollection = db.collection("log");
        messageCollection.insert(msg);
        console.log('saved');
    },
    printMessage: function(msg) {        
    }
};