require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Rahul Thakur" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

async function registrationEmail(userEmail, name) {
  const subject = "Welcome to backend ledger";
  const text = `you have successfully registered`;
  const html = `<h1>you have successfully registered</h1>`;
  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Transaction Successful",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Transaction Successful</h2>

                <p>Hello ${name},</p>

                <p>Your transaction has been successfully completed.</p>

                <div style="
                    background: #f5f5f5;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                ">
                    <p><strong>Amount:</strong> ₹${amount}</p>
                    <p><strong>To Account:</strong> ${toAccount}</p>
                    <p><strong>Status:</strong> Successful</p>
                </div>

                <p>
                    If you did not make this transaction, please contact
                    our support team immediately.
                </p>

                <p>Thank you,<br>Banking Team</p>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("Transaction email sent successfully");
  } catch (error) {
    console.error("Error sending transaction email:", error);
  }
}

async function sendFailedTransactionEmail(
  userEmail,
  name,
  amount,
  toAccount,
  reason,
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Transaction Failed - Payment Alert",

    html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial,sans-serif;">

            <div style="max-width:600px; margin:30px auto; background:white;
                        padding:30px; border-radius:10px;">

                <h2 style="text-align:center;">
                    Transaction Failed
                </h2>

                <p>Hello <strong>${name}</strong>,</p>

                <p>
                    Unfortunately, your transaction could not be completed.
                </p>

                <hr>

                <h3>Transaction Details</h3>

                <p>
                    <strong>Amount:</strong> ₹${amount}
                </p>

                <p>
                    <strong>To Account:</strong> ${toAccount}
                </p>

                <p>
                    <strong>Status:</strong> Failed
                </p>

                <p>
                    <strong>Reason:</strong> ${reason}
                </p>

                <hr>

                <p style="font-size:13px; color:#666;">
                    Please verify your account details and try again.
                    If you believe this is an error, please contact our
                    support team.
                </p>

                <p>
                    Regards,<br>
                    <strong>Your Banking Team</strong>
                </p>

            </div>

        </body>
        </html>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Failed transaction email sent successfully");
  } catch (error) {
    console.error("Error sending failed transaction email:", error);
  }
}
module.exports = {
  sendEmail,
  registrationEmail,
  sendTransactionEmail,
  sendFailedTransactionEmail,
};
