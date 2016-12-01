from django.contrib import admin
from .models import StreetBlock
from .models import Zone
from .models import Photo
from .models import Sign
from .models import CityStateCode
from .models import MapCoordinates


class ZoneMapCoordinatesInline(admin.TabularInline): 
    model = MapCoordinates
    verbose_name = "Coordinates"
    exclude = ('sign',)
    extra = 1 #blank rows

class SignMapCoordinatesInline(admin.TabularInline): 
    model = MapCoordinates
    verbose_name = "Coordinates"
    exclude = ('zone','order')
    extra = 0 #blank rows


class SignInline(admin.TabularInline):
    model = StreetBlock.signs.through
    verbose_name = "Signs"
    extra = 1

class ZoneAdmin(admin.ModelAdmin):
    fields = [('fillcolorrgb', 'strokecolorrgb'), 'priority', ('label', 'zonetype'), 'holiday_bool']
    inlines = [ZoneMapCoordinatesInline]

class SignAdmin(admin.ModelAdmin):
    fields = ['days', ('timestart', 'timeend'), ('zone', 'restriction'), 'rawtext', 'photo']
    inlines = [SignMapCoordinatesInline]

class CityStateCodeAdmin(admin.ModelAdmin):
    fields = ['city', 'state', 'zipcode']

class StreetBlockAdmin(admin.ModelAdmin):
    fields = [('addresshigh', 'addresslow', 'side'), 'name', 'csc']
    inlines = [SignInline]

class PhotoAdmin(admin.ModelAdmin):
    fields = ['rawtext', 'image', 'pub_date']
    list_display = ('pub_date', 'image')

class CoordsAdmin(admin.ModelAdmin):
    fields = [('order', 'lat', 'lng'), ('sign', 'zone', 'block')]
    list_display = ('order', 'lat', 'lng', 'sign', 'zone', 'block')

admin.site.register(Zone, ZoneAdmin)
admin.site.register(Sign, SignAdmin)
admin.site.register(CityStateCode, CityStateCodeAdmin)
admin.site.register(StreetBlock, StreetBlockAdmin)
admin.site.register(Photo, PhotoAdmin)
admin.site.register(MapCoordinates, CoordsAdmin)