from django.contrib import admin
from .models import StreetBlock
from .models import Zone
from .models import Photo
from .models import Sign
from .models import CityStateCode
from .models import StreetBlockCoords


class StreetBlockCoordsInline(admin.TabularInline): 
    model = StreetBlockCoords
    extra = 1 #blank rows

class ZoneAdmin(admin.ModelAdmin):
    fields = [('fillcolorrgb', 'strokecolorrgb'), 'priority', 'zonetype', 'holiday_bool']

class SignAdmin(admin.ModelAdmin):
    fields = ['days', 'timestart', 'timeend', 'zone', 'restriction', 'rawtext']

class CityStateCodeAdmin(admin.ModelAdmin):
    fields = ['city', 'state', 'zipcode']

class StreetBlockAdmin(admin.ModelAdmin):
    fields = [('addresshigh', 'addresslow'), 'name', 'csc', 'signs']
    inlines = [StreetBlockCoordsInline]



class PhotoAdmin(admin.ModelAdmin):
    fields = ['signs', 'rawtext', 'image', 'pub_date','latgps', 'longps']


admin.site.register(Zone, ZoneAdmin)
admin.site.register(Sign, SignAdmin)
admin.site.register(CityStateCode, CityStateCodeAdmin)
admin.site.register(StreetBlock, StreetBlockAdmin)
admin.site.register(Photo, PhotoAdmin)