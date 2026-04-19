const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ── EMAIL TEMPLATES ──

const emailTemplates = {

  complaintSubmitted: (userName, complaintTitle, complaintId, priority, address) => ({
    subject: `✅ Complaint Registered! Ref #${complaintId} — NagarSeva`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #e0e0e0">
        
        <!-- Header -->
        <div style="background:#0a3d22;padding:24px 28px;text-align:center">
          <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:2px">🏛️ NAGARSEVA</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">AI Municipal Complaint System</p>
        </div>

        <!-- Body -->
        <div style="padding:28px;background:#fff">
          <h2 style="color:#0a3d22;font-size:18px;margin:0 0 16px">Namaste ${userName}! 🙏</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
           Your complaint has been successfully registered. Our team will address it as soon as possible.
          </p>

          <!-- Complaint Info Box -->
          <div style="background:#f0fdf4;border:1px solid #a5d6a7;border-radius:12px;padding:18px;margin-bottom:20px">
            <p style="color:#2e7d32;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">📋 Complaint Details</p>
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="color:#666;padding:5px 0;width:40%">Reference ID</td><td style="color:#0a3d22;font-weight:700">#${complaintId}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Title</td><td style="color:#333;font-weight:600">${complaintTitle}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Location</td><td style="color:#333">${address}</td></tr>
              <tr><td style="color:#666;padding:5px 0">AI Priority</td>
                <td><span style="background:${priority==='critical'?'#fde8e8':priority==='high'?'#fff3e0':priority==='medium'?'#fffde7':'#e8f5e9'};color:${priority==='critical'?'#c62828':priority==='high'?'#e65100':priority==='medium'?'#f57f17':'#2e7d32'};padding:3px 12px;border-radius:100px;font-weight:700;font-size:12px;text-transform:uppercase">${priority}</span></td>
              </tr>
            </table>
          </div>

          <!-- Status Timeline -->
          <div style="background:#f8f9fa;border-radius:10px;padding:16px;margin-bottom:20px">
            <p style="color:#666;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">📊 Current Status</p>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="text-align:center;flex:1">
                <div style="width:32px;height:32px;background:#0a3d22;border-radius:50%;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px">✓</div>
                <p style="font-size:11px;color:#0a3d22;font-weight:700;margin:0">Submitted</p>
              </div>
              <div style="flex:1;height:2px;background:#e0e0e0;margin:0 4px;margin-bottom:16px"></div>
              <div style="text-align:center;flex:1">
                <div style="width:32px;height:32px;background:#e0e0e0;border-radius:50%;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px">👷</div>
                <p style="font-size:11px;color:#999;margin:0">Assigned</p>
              </div>
              <div style="flex:1;height:2px;background:#e0e0e0;margin:0 4px;margin-bottom:16px"></div>
              <div style="text-align:center;flex:1">
                <div style="width:32px;height:32px;background:#e0e0e0;border-radius:50%;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px">🔧</div>
                <p style="font-size:11px;color:#999;margin:0">In Progress</p>
              </div>
              <div style="flex:1;height:2px;background:#e0e0e0;margin:0 4px;margin-bottom:16px"></div>
              <div style="text-align:center;flex:1">
                <div style="width:32px;height:32px;background:#e0e0e0;border-radius:50%;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px">✅</div>
                <p style="font-size:11px;color:#999;margin:0">Resolved</p>
              </div>
            </div>
          </div>

          <div style="background:#e3f2fd;border-radius:8px;padding:12px 16px;margin-bottom:20px">
            <p style="color:#0277bd;font-size:13px;margin:0">📱 <strong>Track your complaint status</strong> by logging into the NagarSeva portal and navigating to "My Complaints".</p>
          </div>

          <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">
            This is an automated email. Please do not reply.<br>
            If you did not submit this complaint, please contact us at nagarseva.gov.in.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f5f5f5;padding:14px 28px;text-align:center">
          <p style="color:#999;font-size:12px;margin:0">© 2026 NagarSeva — AI Municipal Complaint System</p>
        </div>
      </div>
    `
  }),

  complaintResolved: (userName, complaintTitle, complaintId, workerNotes, resolvedDate) => ({
    subject: `🎉 Complaint Resolved! Ref #${complaintId} — NagarSeva`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #e0e0e0">

        <!-- Header -->
        <div style="background:#0a3d22;padding:24px 28px;text-align:center">
          <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:2px">🏛️ NAGARSEVA</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">AI Municipal Complaint System</p>
        </div>

        <!-- Success Banner -->
        <div style="background:#00c853;padding:20px;text-align:center">
          <p style="font-size:40px;margin:0">🎉</p>
          <h2 style="color:#fff;font-size:20px;margin:8px 0 0">Complaint Successfully Resolved!</h2>
        </div>

        <!-- Body -->
        <div style="padding:28px;background:#fff">
          <h3 style="color:#0a3d22;font-size:16px;margin:0 0 12px">Namaste ${userName}!</h3>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
           Your complaint has been successfully resolved. Our field team has fixed the issue. Thank you for your patience!
          </p>

          <!-- Resolved Info -->
          <div style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:12px;padding:18px;margin-bottom:20px">
            <p style="color:#2e7d32;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">✅ Resolution Details</p>
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="color:#666;padding:5px 0;width:40%">Reference ID</td><td style="color:#0a3d22;font-weight:700">#${complaintId}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Complaint</td><td style="color:#333;font-weight:600">${complaintTitle}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Resolved On</td><td style="color:#333">${resolvedDate}</td></tr>
              <tr><td style="color:#666;padding:5px 0">Status</td><td><span style="background:#e8f5e9;color:#2e7d32;padding:3px 12px;border-radius:100px;font-weight:700;font-size:12px">RESOLVED</span></td></tr>
            </table>
            ${workerNotes ? `
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid #c8e6c9">
              <p style="color:#555;font-size:13px;margin:0"><strong>Worker Notes:</strong> ${workerNotes}</p>
            </div>` : ''}
          </div>

          <!-- Completed Timeline -->
          <div style="background:#f8f9fa;border-radius:10px;padding:16px;margin-bottom:20px">
            <p style="color:#666;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">📊 Complaint Journey</p>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="text-align:center;flex:1">
                <div style="width:32px;height:32px;background:#0a3d22;border-radius:50%;margin:0 auto 4px;color:#fff;font-size:14px;line-height:32px;text-align:center">✓</div>
                <p style="font-size:11px;color:#0a3d22;font-weight:700;margin:0">Submitted</p>
              </div>
              <div style="flex:1;height:2px;background:#0a3d22;margin:0 4px;margin-bottom:16px"></div>
              <div style="text-align:center;flex:1">
                <div style="width:32px;height:32px;background:#0a3d22;border-radius:50%;margin:0 auto 4px;color:#fff;font-size:14px;line-height:32px;text-align:center">✓</div>
                <p style="font-size:11px;color:#0a3d22;font-weight:700;margin:0">Assigned</p>
              </div>
              <div style="flex:1;height:2px;background:#0a3d22;margin:0 4px;margin-bottom:16px"></div>
              <div style="text-align:center;flex:1">
                <div style="width:32px;height:32px;background:#0a3d22;border-radius:50%;margin:0 auto 4px;color:#fff;font-size:14px;line-height:32px;text-align:center">✓</div>
                <p style="font-size:11px;color:#0a3d22;font-weight:700;margin:0">In Progress</p>
              </div>
              <div style="flex:1;height:2px;background:#0a3d22;margin:0 4px;margin-bottom:16px"></div>
              <div style="text-align:center;flex:1">
                <div style="width:32px;height:32px;background:#00c853;border-radius:50%;margin:0 auto 4px;color:#fff;font-size:14px;line-height:32px;text-align:center">✅</div>
                <p style="font-size:11px;color:#00c853;font-weight:700;margin:0">Resolved!</p>
              </div>
            </div>
          </div>

          <!-- Rating Request -->
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:16px;margin-bottom:20px;text-align:center">
            <p style="color:#f57f17;font-size:14px;font-weight:600;margin:0 0 6px">⭐ Rate Our Service!</p>
            <p style="color:#666;font-size:13px;margin:0">Log in to the NagarSeva portal and provide your feedback. Your rating helps us improve!</p>
          </div>

          <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">
            This is an automated email. Please do not reply.<br>
            © 2026 NagarSeva — AI Municipal Complaint System
          </p>
        </div>

        <div style="background:#f5f5f5;padding:14px 28px;text-align:center">
          <p style="color:#999;font-size:12px;margin:0">© 2026 NagarSeva — Your Service, Our Responsibility</p>
        </div>
      </div>
    `
  })
};

// ── SEND EMAIL ──
const sendEmail = async (toEmail, template) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ Email config missing — skipping');
      return false;
    }
    await transporter.sendMail({
      from: `"NagarSeva 🏛️" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: template.subject,
      html: template.html
    });
    console.log(`✅ Email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return false;
  }
};

// ── MAIN FUNCTIONS ──

// Complaint submitted notification
const notifyComplaintSubmitted = async (user, complaint) => {
  const complaintId = complaint._id.toString().slice(-6).toUpperCase();
  if (user.email) {
    const template = emailTemplates.complaintSubmitted(
      user.name,
      complaint.title,
      complaintId,
      complaint.priority || 'medium',
      complaint.location?.address || 'N/A'
    );
    await sendEmail(user.email, template);
  } else {
    console.log('⚠️ No email found for user:', user.name);
  }
};

// Complaint resolved notification
const notifyComplaintResolved = async (user, complaint) => {
  const complaintId = complaint._id.toString().slice(-6).toUpperCase();
  const resolvedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  if (user.email) {
    const template = emailTemplates.complaintResolved(
      user.name,
      complaint.title,
      complaintId,
      complaint.workerNotes || '',
      resolvedDate
    );
    await sendEmail(user.email, template);
  } else {
    console.log('⚠️ No email found for user:', user.name);
  }
};

module.exports = { notifyComplaintSubmitted, notifyComplaintResolved };