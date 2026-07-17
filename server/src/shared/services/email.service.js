import transporter from "../../config/mail/connectMail.js";
import env from "../../config/env/index.js";

class EmailService {
  // Send a generic email
  async send({ to, subject, html, text = "" }) {
    try {
      return await transporter.sendMail({
        from: `"FinPilot" <${env.SMTP_EMAIL}>`,
        to,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error("Email Error:", error.message);
      throw error;
    }
  }

  // Send workspace invitation email
  async sendWorkspaceInvite({
    email,
    workspace,
    inviter,
    inviteLink,
  }) {
    return this.send({
      to: email,
      subject: `Invitation to join ${workspace}`,
      html: `
        <h2>Workspace Invitation</h2>

        <p>${inviter} invited you to join <b>${workspace}</b>.</p>

        <p>
          <a href="${inviteLink}">
            Accept Invitation
          </a>
        </p>
      `,
    });
  }

  // Send password reset email
  async sendPasswordReset({
    email,
    resetLink,
  }) {
    return this.send({
      to: email,
      subject: "Reset your password",
      html: `
        <h2>Password Reset</h2>

        <p>Click the button below to reset your password.</p>

        <p>
          <a href="${resetLink}">
            Reset Password
          </a>
        </p>
      `,
    });
  }

  // Send budget limit alert
  async sendBudgetAlert({
    email,
    budget,
    spent,
    limit,
  }) {
    return this.send({
      to: email,
      subject: "Budget Alert",
      html: `
        <h2>Budget Limit Reached</h2>

        <p><strong>Budget:</strong> ${budget}</p>

        <p><strong>Spent:</strong> ₹${spent}</p>

        <p><strong>Limit:</strong> ₹${limit}</p>
      `,
    });
  }

  // Send monthly report email
  async sendMonthlyReport({
    email,
    reportUrl,
  }) {
    return this.send({
      to: email,
      subject: "Monthly Financial Report",
      html: `
        <h2>Your Monthly Report</h2>

        <p>Your monthly financial report is ready.</p>

        <p>
          <a href="${reportUrl}">
            Download Report
          </a>
        </p>
      `,
    });
  }

  // Send a generic notification email
  async sendNotification({
    email,
    title,
    message,
  }) {
    return this.send({
      to: email,
      subject: title,
      html: `
        <h2>${title}</h2>

        <p>${message}</p>
      `,
    });
  }
}

export default new EmailService();