// notifications.js

const notifications = {
    Admin_Creates_a_New_User: (username) => ({
        title: `Admin Creates a New User`,
        message: `You are registered as a [User Role] on learn2Read. Please find your login credntials below and use the link below to login`
    })

};

module.exports = notifications;
