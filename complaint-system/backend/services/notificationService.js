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
            <p style="color:#0277bd;font-size:13px;margin:0">🚀 <strong>What you can do:</strong><br>
            Report garbage, drainage, and road damage issues. AI will instantly assign priority!</p>
          </div>
          <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">
            If you don't create an account, please ignore this email.
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
            Your complaint has been successfully registered. Our team will look into it shortly.
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
          <div style="background:#f8f9fa;border-radius:10px;padding:14px;margin-bottom:20px">
            <p style="color:#555;font-size:12px;font-weight:700;text-transform:uppercase;margin:0 0 10px">📊 Current Status</p>
            <div style="display:flex;align-items:center">
              <div style="text-align:center;flex:1">
                <div style="width:28px;height:28px;background:#0a3d22;border-radius:50%;margin:0 auto 4px;color:#fff;font-size:12px;line-height:28px;text-align:center">✓</div>
                <p style="font-size:10px;color:#0a3d22;font-weight:700;margin:0">Submitted</p>
              </div>
              <div style="flex:1;height:2px;background:#e0e0e0;margin-bottom:16px"></div>
              <div style="text-align:center;flex:1">
                <div style="width:28px;height:28px;background:#e0e0e0;border-radius:50%;margin:0 auto 4px;color:#999;font-size:12px;line-height:28px;text-align:center">👷</div>
                <p style="font-size:10px;color:#999;margin:0">Assigned</p>
              </div>
              <div style="flex:1;height:2px;background:#e0e0e0;margin-bottom:16px"></div>
              <div style="text-align:center;flex:1">
                <div style="width:28px;height:28px;background:#e0e0e0;border-radius:50%;margin:0 auto 4px;color:#999;font-size:12px;line-height:28px;text-align:center">🔧</div>
                <p style="font-size:10px;color:#999;margin:0">In Progress</p>
              </div>
              <div style="flex:1;height:2px;background:#e0e0e0;margin-bottom:16px"></div>
              <div style="text-align:center;flex:1">
                <div style="width:28px;height:28px;background:#e0e0e0;border-radius:50%;margin:0 auto 4px;color:#999;font-size:12px;line-height:28px;text-align:center">✅</div>
                <p style="font-size:10px;color:#999;margin:0">Resolved</p>
              </div>
            </div>
          </div>
          <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">
            To check the status of your complaint, please log in to the portal and navigate to the "My Complaints" section.
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
    'assigned': { emoji: '👷', title: 'Worker Assigned!', msg: 'Your complaint is assigned to a field worker.', color: '#0277bd', bg: '#e3f2fd' },
    'in-progress': { emoji: '🔧', title: 'Work Started!', msg: 'Your field worker is working on your complaint.', color: '#f57f17', bg: '#fff8e1' },
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
          <div style="background:#f0fdf4;border:1px solid #a5d6a7;border-radius:12px;padding:18px;margin-bottom:20px">
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="color:#666;padding:5px 0;width:40%">Reference ID</td><td style="color:#0a3d22;font-weight:700">#${refId}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Complaint</td><td style="color:#333;font-weight:600">${complaint.title}</td></tr>
              <tr><td style="color:#666;padding:5px 0">New Status</td>
                <td><span style="background:${info.bg};color:${info.color};padding:3px 12px;border-radius:100px;font-weight:700;font-size:12px;text-transform:uppercase">${newStatus.replace('-',' ')}</span></td>
              </tr>
              ${complaint.assignedWorker ? `<tr><td style="color:#666;padding:5px 0">Worker</td><td style="color:#333">${complaint.assignedWorker.name || ''}</td></tr>` : ''}
            </table>
          </div>
          <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">
            Log in to the portal to check the status of your complaint.
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
            Namaste <strong>${user.name}</strong>! Your complaint has been resolved. Our team has fixed the issue. Thank you!
          </p>
          <div style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:12px;padding:18px;margin-bottom:20px">
            <p style="color:#2e7d32;font-size:12px;font-weight:700;text-transform:uppercase;margin:0 0 12px">✅ Resolution Details</p>
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="color:#666;padding:5px 0;width:40%">Reference ID</td><td style="color:#0a3d22;font-weight:700">#${refId}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Complaint</td><td style="color:#333;font-weight:600">${complaint.title}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Resolved On</td><td style="color:#333">${resolvedDate}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Status</td>
                <td><span style="background:#e8f5e9;color:#2e7d32;padding:3px 12px;border-radius:100px;font-weight:700;font-size:12px">RESOLVED ✓</span></td>
              </tr>
              ${complaint.workerNotes ? `<tr><td style="color:#666;padding:5px 0">Worker Notes</td><td style="color:#555">${complaint.workerNotes}</td></tr>` : ''}
            </table>
          </div>
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:14px;margin-bottom:20px;text-align:center">
            <p style="color:#f57f17;font-size:14px;font-weight:600;margin:0 0 4px">⭐ Rate our service!</p>
            <p style="color:#666;font-size:12px;margin:0">Log in to the portal and share your feedback.</p>
          </div>
          <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">
            Your satisfaction is our priority!
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