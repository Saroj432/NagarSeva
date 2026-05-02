const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const otpStore = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// ══════════════════════════════════════════
// FAKE / TEMP EMAIL DOMAINS — 200+ blocked
// ══════════════════════════════════════════
const BLOCKED_DOMAINS = new Set([
  // Classic temp mail
  'tempmail.com','throwaway.email','guerrillamail.com','mailinator.com',
  'yopmail.com','trashmail.com','fakeinbox.com','10minutemail.com',
  'tempinbox.com','dispostable.com','sharklasers.com','spam4.me',
  'maildrop.cc','discard.email','temp-mail.org','getnada.com',
  'mailnull.com','mohmal.com','tempr.email','getairmail.com',
  'filzmail.com','throwam.com','spamgourmet.com','trashmail.io',
  'fakemailgenerator.com','mailscrap.com','spambox.us','tempemail.net',
  'spamfree24.org','mailexpire.com','notmailinator.com','minuteinbox.com',
  'tempinbox.net','mailnesia.com','spamgourmet.net','trashmail.me',
  'trashmail.net','spamfree24.org','getairmail.com',
  // Guerrilla variants
  'grr.la','guerrillamailblock.com','spam4.me','trashmail.at',
  'trashmail.io','trashmail.me','trashmail.net','trashmail.org',
  // 10 minute mail variants
  '10minutemail.net','10minutemail.org','10minutemail.de','10minemail.com',
  '10mail.org','10minutemail.co.uk','10minutemail.us','10minutemail.be',
  // Yopmail variants
  'yopmail.fr','cool.fr.nf','jetable.fr.nf','nospam.ze.tc',
  'nomail.xl.cx','mega.zik.dj','speed.1s.fr','courriel.fr.nf',
  // Mailinator variants
  'mailinator2.com','mailinater.com','mailinator.net','mailinator.org',
  'suremail.info','spamherelots.com','binkmail.com','safetymail.info',
  'spamhereplease.com','tradermail.info','mt2009.com','mt2014.com',
  // Throwam / discard
  'discardmail.com','discardmail.de','spamgourmet.net','spamgourmet.org',
  'spamgourmet.com','spam.la','spamhole.com','spamify.com',
  // Temp-mail variants
  'temp-mail.ru','temp-mail.io','tmpmail.net','tmpmail.org',
  'tempail.com','tempalias.com','temporary-mail.net','temporaryemail.net',
  'temporaryemail.us','temporaryforwarding.com','temporaryinbox.com',
  'throwam.com','throwammail.com','throwemmail.com',
  // Fake generators
  'fakemailgenerator.net','fakeinbox.net','fakemail.net','fakemailgenerator.com',
  'fakemail.fr','fakemailz.com','emailondeck.com','emailsensei.com',
  // Spam traps
  'spam.abuse.ch','spamthis.co.uk','spamtrap.ro','spaml.com',
  'spammotel.com','spamoff.de','spamgob.com',
  // Burner / one-time
  'burnermail.io','burnermailz.com','mytrashmail.com','trashdevil.com',
  'trashdevil.de','trashemail.de','trashmail.app',
  // Others
  'mailnull.com','mailslurp.com','mailet.net','mailezee.com',
  'mailfreeonline.com','mailguard.me','mailhazard.com','mailimate.com',
  'mailin8r.com','mailinblack.com','mailme.lv','mailme24.com',
  'mailmetrash.com','mailmoat.com','mailnew.com','mailo.icu',
  'mailpoof.com','mailquack.com','mailsac.com','mailscrap.com',
  'mailshell.com','mailsiphon.com','mailslite.com','mailsource.info',
  'mailspam.me','mailspam.xyz','mailtemp.info','mailtemp.net',
  'mailtemp.org','mailtothis.com','mailzilla.com','mailzilla.org',
  'meltmail.com','moncourrier.fr.nf','monemail.fr.nf','monmail.fr.nf',
  'nervmich.net','nervtmich.net','netmails.com','netmails.net',
  'nospamfor.us','nospammail.net','nowmymail.com','objectmail.com',
  'obobbo.com','odaymail.com','oneoffemail.com','oneoffmail.com',
  'onewaymail.com','oopi.org','owlpic.com',
  'pookmail.com','powered.name','privacy.net','proxymail.eu',
  'punkass.com','putthisinyourspamdatabase.com',
  'quickinbox.com','rcpt.at','recode.me','recursor.net',
  'regbypass.com','regbypass.comsafe-mail.net',
  'safetypost.de','shieldedmail.com','shiftmail.com','shitmail.me',
  'shitmail.org','shitware.nl','shortmail.net','sibmail.com',
  'skeefmail.com','slapsfromlastnight.com','slaskpost.se',
  'slopsbox.com','smellfear.com','snakemail.com','sneakemail.com',
  'snkmail.com','sofimail.com','sogetthis.com','soodo.com',
  'spam.org.tr','spamail.de','spambob.com','spambob.net','spambob.org',
  'spamcannon.com','spamcannon.net','spamcero.com','spamcon.org',
  'spamcorptastic.com','spamcowboy.com','spamcowboy.net','spamcowboy.org',
  'spamday.com','spamex.com','spamfree.eu','spamfree24.de',
  'spamfree24.eu','spamfree24.info','spamfree24.net','spamfree24.org',
  'spamgoes.in','spamgourmet.com','spamgourmet.net','spamgourmet.org',
  'spamgrap.de','spamhereplease.com','spamhole.com','spamify.com',
  'spaminator.de','spamkill.info','spaml.com','spaml.de',
  'spammotel.com','spamoff.de','spamserver.eu','spamspot.com',
  'spamstack.net','spamthis.co.uk','spamthisplease.com',
  'spamtrap.ro','spamtrapped.com','spamtroll.net',
  'superrito.com','suremail.info',
  'tempomail.fr','temporaryemail.com','temporaryemail.net',
  'temporaryemail.org','temporaryemail.us','temporaryforwarding.com',
  'temporaryinbox.com','temporarymail.org','tempsky.com',
  'tempthe.net','thankyou2010.com','thisisnotmyrealemail.com',
  'throam.com','throwam.com','throwaway.email',
  'throwaways.info','throwam.com','tilien.com','tittbit.in',
  'tizi.com','tmailinator.com','toiea.com','toomail.net',
  'topranklist.de','tradermail.info','trash-amil.com','trash-mail.at',
  'trash-mail.com','trash-mail.de','trash-mail.ga','trash-mail.io',
  'trash-mail.tk','trash2009.com','trash2010.com','trash2011.com',
  'trashcanmail.com','trashemail.de','trashimail.com','trashmail.app',
  'trashmail.at','trashmail.com','trashmail.de','trashmail.io',
  'trashmail.me','trashmail.net','trashmail.org','trashmail.xyz',
  'trashmailer.com','trashmails.com','trbvm.com','turual.com',
  'twinmail.de','tyldd.com','uggsrock.com','umail.net',
  'uroid.com','us.af','venompen.com','veryrealemail.com',
  'viditag.com','viewcastmedia.com','viewcastmedia.net',
  'viewcastmedia.org','vomoto.com','vpn.st','vsimcard.com',
  'vubby.com','wasteland.rfc822.org','webemail.me','webm4il.info',
  'wegwerfadresse.de','wegwerfemail.com','wegwerfemail.de',
  'wegwerfemail.net','wegwerfemail.org','wegwerfmail.de',
  'wegwerfmail.info','wegwerfmail.net','wegwerfmail.org',
  'wetrainbayarea.com','wetrainbayarea.org','wh4f.org','whyspam.me',
  'willhackforfood.biz','willselfdestruct.com','winemaven.info',
  'wronghead.com','wuzupmail.net','www.e4ward.com','www.mailinator.com',
  'wwwnew.eu','xagloo.co','xagloo.com','xemaps.com','xents.com',
  'xmaily.com','xoxy.net','xyzfree.net','yapped.net','yeah.net',
  'yepmail.net','ygroupmail.com','ymail.net','yogamaven.com',
  'yopmail.com','yopmail.fr','yopmail.gq','youmail.ga','yourdomain.com',
  'yuurok.com','z1p.biz','za.com','zehnminuten.de','zehnminutenmail.de',
  'zippymail.info','zoaxe.com','zoemail.net','zoemail.org',
  'zomg.info','zxcv.com','zxcvbnm.com','zzz.com',
  // Indian fake domains
  'tempmailid.com','tempemailid.com','fakemail.in','spammail.in',
]);

// ══════════════════════════════════════════
// TRUSTED REAL DOMAINS — always allow
// ══════════════════════════════════════════
const TRUSTED_DOMAINS = new Set([
  // Google
  'gmail.com','googlemail.com',
  // Yahoo
  'yahoo.com','yahoo.in','yahoo.co.in','yahoo.co.uk','yahoo.co.jp',
  'yahoo.fr','yahoo.de','yahoo.es','yahoo.it','ymail.com','rocketmail.com',
  // Microsoft
  'outlook.com','outlook.in','hotmail.com','hotmail.in','hotmail.co.uk',
  'live.com','live.in','msn.com','windowslive.com',
  // Apple
  'icloud.com','me.com','mac.com',
  // Indian providers
  'rediffmail.com','indiatimes.com','sify.com','indimail.com',
  // Others
  'protonmail.com','proton.me','tutanota.com','tutanota.de',
  'zoho.com','zohomail.com','fastmail.com','fastmail.fm',
  'aol.com','mail.com','inbox.com','gmx.com','gmx.net','gmx.de',
  'hey.com','pm.me',
]);

// ══ Email format ══
function isValidEmailFormat(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// ══ Suspicious pattern check ══
function isSuspiciousEmailPattern(email) {
  const local = email.split('@')[0].toLowerCase();
  // Random char strings like "xkq7nzp" are likely fake
  if (/^[a-z]{6,12}[0-9]{2,6}$/.test(local) && local.length > 10) return true;
  // Very short random looking
  if (/^[a-z0-9]{3,5}$/.test(local) && !/^(info|help|admin|mail|test|user|demo)$/.test(local)) return false;
  return false;
}

// ══ Main domain validator ══
function isRealEmailDomain(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { valid: false, reason: 'Invalid email format!' };

  // Trusted → always pass
  if (TRUSTED_DOMAINS.has(domain)) return { valid: true };

  // Blocked → reject
  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: `"${domain}" ek temporary/fake email service hai! Real email use karein (Gmail, Yahoo, Outlook, Rediffmail etc.)`
    };
  }

  // Suspicious keyword in domain
  const suspiciousKeywords = [
    'temp','trash','spam','fake','throwaway','discard','junk',
    'guerrilla','mailinator','yopmail','dump','burner','disposable',
    'minute','10min','tempmail','fakemail','spammail','trashmail'
  ];
  for (const kw of suspiciousKeywords) {
    if (domain.includes(kw)) {
      return {
        valid: false,
        reason: `"${domain}" suspicious lag raha hai! Real email use karein (Gmail, Yahoo, Outlook etc.)`
      };
    }
  }

  // Unknown domain — allow (OTP delivery prove karega)
  return { valid: true };
}

// ── Indian phone validation ──
function isValidIndianPhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+?91/, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}
function cleanPhone(phone) {
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+?91/, '');
}

// ── OTP Email Sender ──
async function sendOTPEmail(email, otp, purpose) {
  await transporter.sendMail({
    from: `"NagarSeva \uD83C\uDFDB\uFE0F" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: purpose === 'register' ? 'Email Verify Karo - NagarSeva' : 'Password Reset OTP - NagarSeva',
    html: `
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
  });
}

// ══ SEND REGISTER OTP ══
router.post('/send-register-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email daalna zaroori hai!' });
    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ message: 'Invalid email format! Sahi email daalo (e.g. yourname@gmail.com)' });
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

// ══ REGISTER ══
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role, otp } = req.body;
    const emailLower = email.toLowerCase();
    const stored = otpStore[emailLower];
    if (!stored) return res.status(400).json({ message: 'OTP nahi mila. Pehle email verify karein.' });
    if (Date.now() > stored.expires) { delete otpStore[emailLower]; return res.status(400).json({ message: 'OTP expire ho gaya. Dobara try karein.' }); }
    if (stored.otp !== otp) return res.status(400).json({ message: 'Galat OTP! Dobara check karein.' });
    if (!phone) return res.status(400).json({ message: 'Phone number zaroori hai!' });
    if (!isValidIndianPhone(phone)) return res.status(400).json({ message: 'Invalid phone number! Valid Indian mobile number daalo (10 digits, 6-9 se shuru hona chahiye).' });
    const cleaned = cleanPhone(phone);
    const existingPhone = await User.findOne({ phone: cleaned });
    if (existingPhone) return res.status(400).json({ message: 'Ye phone number already registered hai! Alag number use karein.' });
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

// ══ LOGIN ══
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

// ══ FORGOT PASSWORD ══
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmailFormat(email)) return res.status(400).json({ message: 'Invalid email format!' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'Ye email registered nahi hai! Pehle register karein.' });
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore[email.toLowerCase()] = { otp, expires: Date.now() + 10 * 60 * 1000 };
    await sendOTPEmail(email, otp, 'reset');
    res.json({ message: 'OTP aapki email pe bheja gaya!' });
  } catch (err) {
    res.status(500).json({ message: 'Error: ' + err.message });
  }
});

// ══ RESET PASSWORD ══
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