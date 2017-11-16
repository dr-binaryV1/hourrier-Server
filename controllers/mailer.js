const mailer = require('nodemailer');

const transporter = mailer.createTransport({
  service: 'Gmail',
  auth: {
      user: 'Enter Admin Email', // Enter administrative email here
      pass: 'Enter Admin Password' // Enter Password for email here
  }
});

function mail(body){
  // send mail with defined transport object
  transporter.sendMail(body, function (error, info) {
      if (error) {
          return console.log(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
  });
}

module.exports = mail;
