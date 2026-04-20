# email_utils.py
# verify/reset email

import os
import smtplib
from email.message import EmailMessage
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

VERIFY_SALT = "email-verify"
RESET_SALT = "password-reset"
VERIFY_MAX_AGE = 60 * 60 * 24       # 24 hours
RESET_MAX_AGE = 60 * 60             # 1 hour


def _serializer():
    secret = os.environ.get("FLASK_SECRET_KEY")
    if not secret:
        raise RuntimeError("FLASK_SECRET_KEY must be set to sign tokens")
    return URLSafeTimedSerializer(secret)


def make_token(email, salt):
    return _serializer().dumps(email, salt=salt)


def read_token(token, salt, max_age):
    try:
        return _serializer().loads(token, salt=salt, max_age=max_age)
    except SignatureExpired:
        return None
    except BadSignature:
        return None


def send_email(to_addr, subject, body_text, body_html=None):
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", 587))
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASS")
    from_addr = os.environ.get("MAIL_FROM", user)
    from_name = os.environ.get("MAIL_FROM_NAME", "Hooked")

    if not user or not password:
        # Dev fallback: log to console instead of failing.
        print(f"[email_utils] SMTP not configured; would send to {to_addr}:")
        print(f"  Subject: {subject}")
        print(f"  Body: {body_text}")
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_addr}>"
    msg["To"] = to_addr
    msg.set_content(body_text)
    if body_html:
        msg.add_alternative(body_html, subtype="html")

    with smtplib.SMTP(host, port, timeout=15) as s:
        s.starttls()
        s.login(user, password)
        s.send_message(msg)


def send_verification_email(to_addr, frontend_url):
    token = make_token(to_addr, VERIFY_SALT)
    link = f"{frontend_url}/verify-email/{token}"
    send_email(
        to_addr,
        "Verify your Hooked email",
        f"Welcome to Hooked! Verify your email:\n\n{link}\n\nLink expires in 24 hours.",
        f'<p>Welcome to Hooked!</p><p><a href="{link}">Verify your email</a></p>'
        f"<p>Link expires in 24 hours.</p>",
    )


def send_reset_email(to_addr, frontend_url):
    token = make_token(to_addr, RESET_SALT)
    link = f"{frontend_url}/reset-password/{token}"
    send_email(
        to_addr,
        "Reset your Hooked password",
        f"Reset your password:\n\n{link}\n\nLink expires in 1 hour. "
        "If you didn't request this, ignore this email.",
        f'<p><a href="{link}">Reset your password</a></p>'
        f"<p>Link expires in 1 hour. If you didn't request this, ignore this email.</p>",
    )
def send_username_reminder_email(to_addr, username):
    send_email(
        to_addr,
        "Your Hooked username",
        f"Hi!\n\nYour Hooked username is: {username}\n\n"
        "If you didn't request this, you can ignore this email.",
        f"<p>Your Hooked username is: <b>{username}</b></p>"
        "<p>If you didn't request this, ignore this email.</p>",
    )
