from django.conf.urls import url

from . import views

app_name = 'maps'
urlpatterns = [
    url(r'^$', views.IndexView.as_view(), name='index'),   
    url(r'^test/$', views.test, name='test')
    ]