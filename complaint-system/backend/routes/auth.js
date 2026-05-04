const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

const otpStore = {};

const BLOCKED_DOMAINS = new Set([
  'tempmail.com','throwaway.email','guerrillamail.com','mailinator.com',
  'yopmail.com','trashmail.com','fakeinbox.com','10minutemail.com',
  'tempinbox.com','dispostable.com','sharklasers.com','spam4.me',
  'maildrop.cc','discard.email','temp-mail.org','getnada.com',
  'mailnull.com','mohmal.com','tempr.email','getairmail.com',
  'filzmail.com','throwam.com','spamgourmet.com','trashmail.io',
  'fakemailgenerator.com','mailscrap.com','spambox.us','tempemail.net',
  'spamfree24.org','mailexpire.com','notmailinator.com','minuteinbox.com',
  'tempinbox.net','mailnesia.com','spamgourmet.net','trashmail.me',
  'trashmail.net','grr.la','guerrillamailblock.com','trashmail.at',
  '10minutemail.net','10minutemail.org','10minutemail.de','10minemail.com',
  '10mail.org','yopmail.fr','mailinator2.com','mailinater.com',
  'discardmail.com','discardmail.de','temp-mail.ru','temp-mail.io',
  'tmpmail.net','tmpmail.org','tempail.com','tempalias.com',
  'fakemailgenerator.net','fakeinbox.net','fakemail.net',
  'burnermail.io','mytrashmail.com','trashdevil.com','trashmail.app',
  'mailsac.com','mailtemp.info','tempmailid.com','fakemail.in',
]);

const TRUSTED_DOMAINS = new Set([
  'gmail.com','googlemail.com',
  'yahoo.com','yahoo.in','yahoo.co.in','yahoo.co.uk','ymail.com','rocketmail.com',
  'outlook.com','outlook.in','hotmail.com','hotmail.in','live.com','live.in','msn.com',
  'icloud.com','me.com','mac.com',
  'rediffmail.com','indiatimes.com','sify.com',
  'protonmail.com','proton.me','tutanota.com',
  'zoho.com','zohomail.com','fastmail.com',
  'aol.com','mail.com','inbox.com','gmx.com','gmx.net',
]);

function isValidEmailFormat(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function isRealEmailDomain(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { valid: false, reason: 'Invalid email format!' };
  if (TRUSTED_DOMAINS.has(domain)) return { valid: true };
  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: `"${domain}" ek temporary/fake email service hai! Real email use karein (Gmail, Yahoo, Outlook, Rediffmail etc.)`
    };
  }
  const suspiciousKeywords = [
    'temp','trash','spam','fake','throwaway','discard','junk',
    'guerrilla','mailinator','yopmail','dump','burner','disposable',
    'minute','10min','tempmail','fakemail','spammail','trashmail'
  ];
  for (const kw of suspiciousKeywords) {
    if (domain.includes(kw)) {
      return {
        valid: false,
        reason: `"${domain}" suspicious lag raha hai! Real email use karein.`
      };
    }
  }
  return { valid: true };
}

function isValidIndianPhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+?91/, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

function cleanPhone(phone) {
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+?91/, '');
}

async function sendOTPEmail(email, otp, purpose) {
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: 'NagarSeva', email: 'sarojkumarmahto432@gmail.com' },
      to: [{ email: email }],
      subject: purpose === 'register' ? 'Email Verify Karo - NagarSeva' : 'Password Reset OTP - NagarSeva',
      htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#f4f6f0;border-radius:12px">
          <div style="background:#0a3d22;padding:16px;border-radius:8px;text-align:center;margin-bottom:1.5rem">
            <h2 style="color:#fff;margin:0">NagarSeva</h2>
            <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px">AI Municipal Complaint System</p>
          </div>
          <h3 style="color:#0a3d22">${purpose === 'register' ? 'Email Verification' : 'Password Reset'}</h3>
          <p style="color:#555;font-size:14px">
            ${purpose === 'register'
              ? 'NagarSeva mein register karne ke liye apna email verify karein.'
              : 'Apna password reset karne ke liye ye OTP use karein.'}
          </p>
          <div style="background:#fff;border-radius:10px;padding:1.5rem;text-align:center;margin:1.5rem 0;border:2px dashed #0a3d22">
            <p style="color:#666;font-size:13px;margin:0 0 8px">Aapka OTP Code:</p>
            <h1 style="color:#0a3d22;font-size:3rem;letter-spacing:0.5em;margin:0;font-family:monospace">${otp}</h1>
          </div>
          <div style="background:#fff3cd;border-radius:8px;padding:10px 14px;margin-bottom:1rem">
            <p style="color:#856404;font-size:13px;margin:0">Ye OTP <strong>10 minutes</strong> mein expire ho jaayega.</p>
          </div>
          <p style="color:#999;font-size:12px">Agar aapne ye request nahi ki toh is email ko ignore karein.</p>
        </div>`
    })
  });
}

router.post('/send-register-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email daalna zaroori hai!' });
    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ message: 'Invalid email format!' });
    }
    const domainCheck = isRealEmailDomain(email);
    if (!domainCheck.valid) {
      return res.status(400).json({ errorType: 'FAKE_EMAIL', message: domainCheck.reason });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ errorType: 'ALREADY_REGISTERED', exists: true, message: 'Ye email already registered hai!' });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore[email.toLowerCase()] = { otp, expires: Date.now() + 10 * 60 * 1000 };
    await sendOTPEmail(email, otp, 'register');
    res.json({ message: `OTP ${email} pe bheja gaya! Inbox check karein.`, otpSent: true });
  } catch (err) {
    console.error('send-register-otp error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role, otp } = req.body;
    const emailLower = email.toLowerCase();
    const stored = otpStore[emailLower];
    if (!stored) return res.status(400).json({ message: 'OTP nahi mila. Pehle email verify karein.' });
    if (Date.now() > stored.expires) { delete otpStore[emailLower]; return res.status(400).json({ message: 'OTP expire ho gaya. Dobara try karein.' }); }
    if (stored.otp !== otp) return res.status(400).json({ message: 'Galat OTP! Dobara check karein.' });
    if (!phone) return res.status(400).json({ message: 'Phone number zaroori hai!' });
    if (!isValidIndianPhone(phone)) return res.status(400).json({ message: 'Invalid phone number!' });
    const cleaned = cleanPhone(phone);
    const existingPhone = await User.findOne({ phone: cleaned });
    if (existingPhone) return res.status(400).json({ message: 'Ye phone number already registered hai!' });
    const existingEmail = await User.findOne({ email: emailLower });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered hai!' });
    const userRole = ['user', 'worker'].includes(role) ? role : 'user';
    const user = new User({ name, email: emailLower, password, phone: cleaned, address, role: userRole });
    await user.save();
    delete otpStore[emailLower];
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name, email: emailLower, role: userRole } });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email aur password dono zaroori hain!' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Email ya password galat hai.' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Email ya password galat hai.' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/me', auth, async (req, res) => { res.json(req.user); });

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmailFormat(email)) return res.status(400).json({ message: 'Invalid email format!' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'Ye email registered nahi hai!' });
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore[email.toLowerCase()] = { otp, expires: Date.now() + 10 * 60 * 1000 };
    await sendOTPEmail(email, otp, 'reset');
    res.json({ message: 'OTP aapki email pe bheja gaya!' });
  } catch (err) {
    res.status(500).json({ message: 'Error: ' + err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const emailLower = email.toLowerCase();
    const stored = otpStore[emailLower];
    if (!stored) return res.status(400).json({ message: 'OTP nahi mila.' });
    if (Date.now() > stored.expires) { delete otpStore[emailLower]; return res.status(400).json({ message: 'OTP expire ho gaya.' }); }
    if (stored.otp !== otp) return res.status(400).json({ message: 'Galat OTP.' });
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(404).json({ message: 'User nahi mila.' });
    user.password = newPassword;
    await user.save();
    delete otpStore[emailLower];
    res.json({ message: 'Password reset ho gaya! Ab login karein.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;