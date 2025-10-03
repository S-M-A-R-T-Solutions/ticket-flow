const router = require('express').Router();

router.post('/callStatusWebhook', async (req, res, next) => {
    try {
        console.log('Received Twilio call status webhook:', req.body);

        return res.status(200).json('Webhook received');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;