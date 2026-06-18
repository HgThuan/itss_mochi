const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let testUser = await User.findOne();
    if (!testUser) {
       testUser = await User.create({
         username: 'TestUser',
         email: 'test@example.com',
         password: 'password123',
         preferredLanguage: 'en',
         coins: 1000
       });
    } else if (testUser.username === 'TestUser' && testUser.preferredLanguage === 'ja') {
       testUser.preferredLanguage = 'en';
       await testUser.save();
    }
    req.user = testUser;
    next();
  } catch (error) {
    console.error("Auth bypass error:", error);
    res.status(500).json({ message: 'Error in auth bypass' });
  }
};

module.exports = { protect };
