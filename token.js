var crypto = require('crypto')
    , text = 'I love cupcakes'
    , key = 'abcdeg'
    , hash

var myText ;

// InvalidTokenDataError error constructor
function InvalidTokenDataError(message) {
    this.name = "InvalidTokenDataError";
    this.message = (message || "");
}
InvalidTokenDataError.prototype = new Error();

// InvalidTokenError error constructor

function InvalidTokenError(message) {
    this.name = "InvalidTokenError";
    this.message = (message || "");
}
InvalidTokenError.prototype = new Error();


exports.InvalidTokenError = function(msg){
    return new InvalidTokenError(msg);
} ;
exports.InvalidTokenDataError =function(msg){
    return new InvalidTokenDataError(msg);
} ;

exports.SplitMe = function(stringToSplit, delimiter)
{
    return stringToSplit.split(delimiter);
};
exports.generateToken = function(data, cryptoSecret, hmacSecret){

    var dJSON = getValidJson(data);
    var payloadHMAC = crypto.createHmac('sha1', hmacSecret).update(dJSON).digest('hex');
    var payload = dJSON + '|||' +payloadHMAC;
    var payload64 = new Buffer(payload).toString('base64');


   var cipher = crypto.createCipher('aes-192-cbc', cryptoSecret)
        , decipher = crypto.createDecipher('aes-192-cbc', cryptoSecret);
    var cryptext = cipher.update(payload64, 'utf8', 'base64');
    cryptext += cipher.final('base64');
    var cHmac = crypto.createHmac('sha1', hmacSecret).update(cryptext).digest('hex');
    var rawToken = cryptext+"." +data.userId+"." +cHmac;
    return new Buffer(rawToken).toString('base64');
}

exports.parseToken = function(data, cryptoSecret, hmacSecret){

    var rawToken  = new Buffer(data, 'base64').toString('ascii');
    var rowTokenArray = rawToken.split('.');
    if(!rowTokenArray || rowTokenArray.length < 3)
        return new InvalidTokenError("Invalid token has been send");
    var cryptext = rowTokenArray[0], cHmacRecieved= rowTokenArray[2];
    var cHmac = crypto.createHmac('sha1', hmacSecret).update(cryptext).digest('hex');
    if(cHmac != cHmacRecieved)
        return new InvalidTokenError("Token has been corrupt");

    var decipher = decipher = crypto.createDecipher('aes-192-cbc', cryptoSecret);
    var payload64 = decipher.update(cryptext, 'base64', 'utf8');
    payload64 += decipher.final('utf8');
    console.log(payload64);
    var payloadArray  = new Buffer(payload64, 'base64').toString('ascii').split("|||");
    if(!payloadArray || payloadArray.length < 2)
        return new InvalidTokenError("Invalid token has been send");
    var dJSON = payloadArray[0], payloadHMACRecieved = payloadArray[1];
    var payloadHMAC = crypto.createHmac('sha1', hmacSecret).update(dJSON).digest('hex');
    if(payloadHMAC != payloadHMACRecieved)
        return new InvalidTokenError("Token has been corrupt");
    var json = JSON.parse(dJSON);
    return json;
}

function getValidJson(json) {
    try {
        return JSON.stringify(json);
    } catch (e) {
        var e = new InvalidTokenDataError("Invalid json data has been send");
        throw e;
    }
}

