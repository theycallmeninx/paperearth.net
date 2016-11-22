from django.conf.urls import include, url
from django.views.generic.base import RedirectView
from django.contrib import admin

from . import views

urlpatterns = [
    url(r'^$', views.IndexView.as_view(), name='index'),
    url(r'^email/$', views.email, name='email'),
	url(r'^polls/', include('polls.urls'), name='polls'),
    url(r'^maps/', include('maps.urls'), name='maps'),
    url(r'^admin/', admin.site.urls),
]