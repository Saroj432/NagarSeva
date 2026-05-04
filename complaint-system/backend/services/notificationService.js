const sendEmail = async (toEmail, template) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: 'NagarSeva', email: 'sarojkumarmahto432@gmail.com' },
        to: [{ email: toEmail }],
        subject: template.subject,
        htmlContent: template.html
      })
    });
    if (response.ok) {
      console.log(`✅ Email sent to ${toEmail}`);
      return true;
    } else {
      const err = await response.json();
      console.error('❌ Email error:', err);
      return false;
    }
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return false;
  }
};

const header = `
  <div style="background:#0a3d22;padding:20px 28px;text-align:center">
    <h1 style="color:#fff;font-size:20px;margin:0;letter-spacing:2px">🏛️ NAGARSEVA</h1>
    <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px">AI Municipal Complaint System</p>
  </div>`;

const footer = `
  <div style="background:#f5f5f5;padding:12px 28px;text-align:center">
    <p style="color:#999;font-size:11px;margin:0">© 2026 NagarSeva — This is an automated email. Please do not reply.</p>
  </div>`;

const notifyUserRegistered = async (user) => {
  if (!user.email) return;
  const template = {
    subject: `🎉 Welcome to NagarSeva! — ${user.name}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #e0e0e0">
        ${header}
        <div style="padding:28px;background:#fff">
          <h2 style="color:#0a3d22;font-size:18px;margin:0 0 16px">Namaste ${user.name}! 🙏</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
            Welcome to NagarSeva! You can now report municipal issues online.
          </p>
          <div style="background:#f0fdf4;border:1px solid #a5d6a7;border-radius:12px;padding:18px;margin-bottom:20px">
            <p style="color:#2e7d32;font-size:12px;font-weight:700;text-transform:uppercase;margin:0 0 12px">👤 Account Details</p>
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="color:#666;padding:5px 0;width:40%">Name</td><td style="color:#333;font-weight:600">${user.name}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Email</td><td style="color:#333">${user.email}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Role</td><td style="color:#333;text-transform:capitalize">${user.role || 'Citizen'}</td></tr>
            </table>
          </div>
          <div style="background:#e3f2fd;border-radius:10px;padding:14px;margin-bottom:20px">
            <p style="color:#0277bd;font-size:13px;margin:0">🚀 <strong>Know you can do:</strong><br>
            Report issues like garbage, drainage, and road damage. AI will instantly assign priority!</p>
          </div>
          <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">
            If you did not create this account, please ignore this email.
          </p>
        </div>
        ${footer}
      </div>`
  };
  await sendEmail(user.email, template);
};

const notifyComplaintSubmitted = async (user, complaint) => {
  if (!user.email) return;
  const refId = complaint._id.toString().slice(-6).toUpperCase();
  const priority = complaint.priority || 'medium';
  const priorityColor = priority==='critical'?'#c62828':priority==='high'?'#e65100':priority==='medium'?'#f57f17':'#2e7d32';
  const priorityBg = priority==='critical'?'#fde8e8':priority==='high'?'#fff3e0':priority==='medium'?'#fffde7':'#e8f5e9';

  const template = {
    subject: `✅ Complaint Registered! Ref #${refId} — NagarSeva`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #e0e0e0">
        ${header}
        <div style="padding:28px;background:#fff">
          <h2 style="color:#0a3d22;font-size:18px;margin:0 0 16px">Namaste ${user.name}! 🙏</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
            Your complaint has been registered successfully. Our team will look into it shortly.
          </p>
          <div style="background:#f0fdf4;border:1px solid #a5d6a7;border-radius:12px;padding:18px;margin-bottom:20px">
            <p style="color:#2e7d32;font-size:12px;font-weight:700;text-transform:uppercase;margin:0 0 12px">📋 Complaint Details</p>
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="color:#666;padding:5px 0;width:40%">Reference ID</td><td style="color:#0a3d22;font-weight:700">#${refId}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Title</td><td style="color:#333;font-weight:600">${complaint.title}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Category</td><td style="color:#333;text-transform:capitalize">${complaint.category}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Location</td><td style="color:#333">${complaint.location?.address || 'N/A'}</td></tr>
              <tr><td style="color:#666;padding:5px 0">AI Priority</td>
                <td><span style="background:${priorityBg};color:${priorityColor};padding:3px 12px;border-radius:100px;font-weight:700;font-size:12px;text-transform:uppercase">${priority}</span></td>
              </tr>
            </table>
          </div>
          <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">
            To Check your complaint status, please login to the portal and go to "My Complaints" section.
          </p>
        </div>
        ${footer}
      </div>`
  };
  await sendEmail(user.email, template);
};

const notifyComplaintStatusUpdate = async (user, complaint, newStatus) => {
  if (!user.email) return;
  const refId = complaint._id.toString().slice(-6).toUpperCase();

  const statusInfo = {
    'assigned': { emoji: '👷', title: 'Worker Assigned!', msg: 'Your complaint has been assigned to a field worker. Work will start soon.', color: '#0277bd', bg: '#e3f2fd' },
    'in-progress': { emoji: '🔧', title: 'Work Started!', msg: 'Our field worker is working on your complaint.', color: '#f57f17', bg: '#fff8e1' },
  };

  const info = statusInfo[newStatus];
  if (!info) return;

  const template = {
    subject: `${info.emoji} Complaint Update — #${refId} NagarSeva`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #e0e0e0">
        ${header}
        <div style="background:${info.bg};padding:20px;text-align:center">
          <p style="font-size:36px;margin:0">${info.emoji}</p>
          <h2 style="color:${info.color};font-size:18px;margin:8px 0 0">${info.title}</h2>
        </div>
        <div style="padding:28px;background:#fff">
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
            Namaste <strong>${user.name}</strong>! ${info.msg}
          </p>
          <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">
            Login to the portal and go to "My Complaints" section to check your complaint status.
          </p>
        </div>
        ${footer}
      </div>`
  };
  await sendEmail(user.email, template);
};

const notifyComplaintResolved = async (user, complaint) => {
  if (!user.email) return;
  const refId = complaint._id.toString().slice(-6).toUpperCase();
  const resolvedDate = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

  const template = {
    subject: `🎉 Complaint Resolved! Ref #${refId} — NagarSeva`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #e0e0e0">
        ${header}
        <div style="background:#00c853;padding:20px;text-align:center">
          <p style="font-size:40px;margin:0">🎉</p>
          <h2 style="color:#fff;font-size:20px;margin:8px 0 0">Complaint Successfully Resolved!</h2>
        </div>
        <div style="padding:28px;background:#fff">
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
            Namaste <strong>${user.name}</strong>! Your complaint has been resolved. Thank you for your patience!
          </p>
          <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">
            Your satisfaction is our priority. If you have any concerns, please report them!
          </p>
        </div>
        ${footer}
      </div>`
  };
  await sendEmail(user.email, template);
};

module.exports = {
  notifyUserRegistered,
  notifyComplaintSubmitted,
  notifyComplaintStatusUpdate,
  notifyComplaintResolved
};