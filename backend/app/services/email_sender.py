import smtplib
from email.message import EmailMessage
from app.core.config import settings
import logging

def send_email_with_attachments(to_email: str, subject: str, body: str, attachments: list = None):
    """
    Отправка email с несколькими вложенными файлами.
    attachments: список словарей [{"filename": "...", "bytes": b"..."}]
    """
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logging.warning(f"Email configuration incomplete. Skipping email to {to_email}")
        return False
    
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
        msg['To'] = to_email
        msg.set_content(body)
        
        # Перебираем все файлы и прикрепляем их к письму
        if attachments:
            for attachment in attachments:
                filename = attachment['filename']
                file_bytes = attachment['bytes']
                
                # Определяем тип файла по расширению
                subtype = 'pdf' if filename.endswith('.pdf') else 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                
                msg.add_attachment(
                    file_bytes,
                    maintype='application',
                    subtype=subtype,
                    filename=filename
                )
        
        # Отправляем письмо
        with smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT) as smtp:
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        
        logging.info(f"Email successfully sent to {to_email}")
        return True
        
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {str(e)}")
        return False