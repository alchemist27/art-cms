const cafe24Auth = require('./cafe24Auth');

// Export all functions
exports.exchangeCafe24Token = cafe24Auth.exchangeCafe24Token;
exports.refreshCafe24Token = cafe24Auth.refreshCafe24Token;
exports.cafe24ApiProxy = cafe24Auth.cafe24ApiProxy;