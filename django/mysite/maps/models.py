from __future__ import unicode_literals

from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.core.validators import int_list_validator, validate_comma_separated_integer_list

class CityStateCode(models.Model):
    city = models.CharField(max_length=200, null=False, default="Anytown")
    state = models.CharField(max_length=200, null=False, default="Deleware")
    zipcode = models.PositiveIntegerField(null=False, default=0)

    def __str__(self):
        return "%s, %s (%s)" %(self.city, self.state, self.zipcode)

class Zone(models.Model):
    priority = models.PositiveSmallIntegerField(null=True)
    fillcolorrgb = models.CharField("Fill Color (rgb)", max_length=200, validators=[validate_comma_separated_integer_list], null=False, default="0,255,255")
    strokecolorrgb = models.CharField("Stroke Color (rgb)", max_length=200, validators=[validate_comma_separated_integer_list], null=False, default="0,255,255")
    zonetype = models.CharField("zone type", max_length=200, null=True)
    label = models.CharField(max_length=200, null=True)
    holiday_bool = models.BooleanField("Holiday Exempt", null=False, default=False)

    def json(self):
        data = {'s': self.strokecolorrgb,
                'f': self.fillcolorrgb,
                'p': self.priority
                }
        return {self.pk: {'c':[], 'd':data}}

    def __str__(self):
        return "%s" %(self.zonetype if self else "None")

class Photo(models.Model):
    rawtext = models.CharField(max_length=200, null=True)
    image = models.ImageField(upload_to="maps/photos/signs", null=False)
    pub_date = models.DateTimeField('date taken')
    description = "Photo Upload Model"

    def __str__(self):
        return self.image.name

class Sign(models.Model):
    days = ArrayField(models.CharField(max_length=10, blank=False, null=False, default="everyday"), size=7)
    timestart = models.PositiveSmallIntegerField("Time Start", null=True)
    timeend = models.PositiveSmallIntegerField("Time End", null=True)
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True)
    restriction =  models.CharField(max_length=200, null=False, default="No")
    rawtext = models.CharField(max_length=200, null=False, blank=True, default="")
    photo = models.ForeignKey(Photo, null=True, blank=True, on_delete=models.SET_NULL)

    def applies(self, days, hour):
        for day in days:
            if day.lower() in self.days:
                print "Day:", day
                return True
        return False


    def __str__(self):
        return "%s (%s)." %(self.zone.zonetype if self.zone else "", 
                            self.restriction)

class StreetBlock(models.Model):
    addresshigh = models.CharField("High", max_length=10, null=False, default="0")
    addresslow = models.CharField("Low", max_length=10, null=False, default="0")
    side = models.CharField("Zone Side", max_length=30, null=True)
    name = models.CharField(max_length=200, null=False, default="main")
    signs = models.ManyToManyField(Sign)
    csc = models.ForeignKey(CityStateCode, verbose_name="City, State, Zip Code", on_delete=models.SET_NULL, null=True)
    odd_bool = models.BooleanField("Odd #", null=False, default=False)

    def __str__(self):
        return "%s-%s %s, %s, %s(%s)" %(self.addresshigh, self.addresslow, self.name,
                            self.csc.city, self.csc.state, self.csc.zipcode)

class MapCoordinates(models.Model):
    ## This can be a lot better. =/
    ## if its a zone, why not store the normal of coordinate relative to its order
    sign = models.ForeignKey(Sign, on_delete=models.CASCADE, blank=True, null=True)
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, blank=True, null=True)
    block = models.ForeignKey(StreetBlock, on_delete=models.CASCADE, blank=True, null=True)
    lat = models.DecimalField("Latitude", max_digits=10, decimal_places=6, default=0.0, null=False)
    lng = models.DecimalField("Longitude", max_digits=10, decimal_places=6, default=0.0, null=False)
    order = models.PositiveSmallIntegerField(null=False, default=0)

    def as_set(self):
        return {'lat': self.lat, 'lng':self.lng}

    def __str__(self):
        return "#%s" %self.order