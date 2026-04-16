import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

def test_email():
    sender_email = os.getenv("SMTP_EMAIL", "")
    sender_password = os.getenv("SMTP_PASSWORD", "")
    receiver_email = "legalaibot058@gmail.com" # send to itself as a test
    otp_code = "123456"
    
    print(f"Testing with: {sender_email} / {sender_password}")
    
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = "Test OTP"
    
    body = f"Test OTP {otp_code}"
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.set_debuglevel(1)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
        print("Success")
    except Exception as e:
        print("Failed:", e)

test_email()
