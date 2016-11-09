from django.views import generic

from django.http import HttpResponseRedirect

from django.urls import reverse

import smtplib
from email.mime.text import MIMEText

USERNAME = 'ninx@paperearth.net'
PASSWORD = 'R0cket33r'


class IndexView(generic.ListView):
    template_name = 'mysite/index.html'

    def get_queryset(self):
        return "Hello, World!!!"

def email(request):
    

    email = request.POST['Email']
    content = request.POST['EmailContent']

    try:
        msg = MIMEText(content)

        msg['Subject'] = 'This is a test'
        msg['From'] = email
        msg['To'] = 'alex@paperearth.net'

        conn = smtplib.SMTP('smtp-relay.gmail.com:587')
        conn.starttls()
        conn.set_debuglevel(False)
        conn.login(USERNAME, PASSWORD)
        try:
            conn.sendmail(email, 'alex@paperearth.net', msg.as_string())
        finally:
            conn.quit()
    except Exception as E:
        print E
    return HttpResponseRedirect(reverse('index'))
