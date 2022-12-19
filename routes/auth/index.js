const express = require('express')
const router = express.Router()

const {loginGet, signupGet, loginPost, signupPost, checkAuth, checkDup} = require('../../controllers/authController')

router.get('/login',loginGet)
router.get('/signup',signupGet)
router.post("/let-me-in",loginPost)
router.post("/add-new-user",signupPost)
router.get('/checkAuth',checkAuth)
router.post('/checkDup',checkDup)

module.exports = router
