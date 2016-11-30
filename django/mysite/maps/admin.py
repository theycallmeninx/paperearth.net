from django.contrib import admin
from .models import StreetBlock
from .models import Zone
from .models import Photo
from .models import Sign
from .models import CityStateCode
from .models import MapCoordinates


class MapCoordinatesInline(admin.TabularInline): 
    model = MapCoordinates
    verbose_name = "Coordinates"
    extra = 1 #blank rows

class ZoneInline(admin.TabularInline):
    model = StreetBlock.zones.through
    verbose_name = "Zone"
    extra = 1

class ZoneAdmin(admin.ModelAdmin):
    fields = [('fillcolorrgb', 'strokecolorrgb'), 'priority', ('label', 'zonetype'), 'holiday_bool']

class SignAdmin(admin.ModelAdmin):
    fields = ['days', 'timestart', 'timeend', 'zone', 'restriction', 'rawtext']

class CityStateCodeAdmin(admin.ModelAdmin):
    fields = ['city', 'state', 'zipcode']

class StreetBlockAdmin(admin.ModelAdmin):
    fields = [('addresshigh', 'addresslow'), 'name', 'csc']
    inlines = [MapCoordinatesInline, ZoneInline]

class PhotoAdmin(admin.ModelAdmin):
    fields = ['signs', 'rawtext', 'image', 'pub_date','latgps', 'longps']


admin.site.register(Zone, ZoneAdmin)
admin.site.register(Sign, SignAdmin)
admin.site.register(CityStateCode, CityStateCodeAdmin)
admin.site.register(StreetBlock, StreetBlockAdmin)
admin.site.register(Photo, PhotoAdmin)