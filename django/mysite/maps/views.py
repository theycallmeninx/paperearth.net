from django.views import generic, View
from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Count


from .models import MapCoordinates
from .models import StreetBlock
from .models import Zone
from .models import Sign
from .models import Photo

from decimal import *

import datetime
import time
import math

"""
todo:
1) based on location, determine address and then determine street block
2) 
"""

class MapsResponse:
    def __init__(self):
        self.zones = {} #this is what I ultimately need.


    def addSignToZone(self, sign, coords):

        zoneid = sign.zone_id
        if not self.zones.get(zoneid, None):
            self.addZone(sign.zone)

        coords = list(coords)[0]
        imgpath = sign.photo.image.url
        tempdict = {'i': imgpath,
                    'r': sign.restriction,
                    'c': coords.as_set()
                    }
        self.zones[zoneid]['s'].append(tempdict)

    def addBlockToZone(self, zone, coords):
        if not self.zones.get(zone.id, None):
            self.addZone(zone)

        tempdict = {}
        coords = list(coords)
        dlength = len(coords)*2-1
        for i in range(len(coords)):
            c = coords[i].as_set()
            
            if i == len(coords)-1:
                tempcoords = {'lat': (c['lat']+(c['lat']-coords[i-1].lat)),
                              'lng': (c['lng']+(c['lng']-coords[i-1].lng))
                              }
            else:
                tempcoords = coords[i+1].as_set()

            tempdict[i] = c
            tempdict[dlength-i] = self.calculateNormal(c, tempcoords)

        if tempdict:
            self.zones[zone.id]['c'].append(tempdict)


    def addZone(self, zone):
        data = {'s': zone.strokecolorrgb,
                'f': zone.fillcolorrgb,
                'p': zone.priority
                }
        self.zones[zone.id] = {'c':[], 'd':data, 's':[]}

    def calculateNormal(self, c1, c2):

        getcontext().prec = 9
        dy = Decimal(c2['lng']) - Decimal(c1['lng'])
        dx = Decimal(c2['lat']) - Decimal(c1['lat'])
        magnitude = math.sqrt((dx*dx) + (dy*dy))
        scalar = Decimal(magnitude / 0.000150)
        return {'lat': c1['lat']+(dy/scalar), 'lng': c1['lng']-(dx/scalar)}

    def as_dict(self):
        getcontext().prec = 9
        return self.zones



class IndexView(View):

    def dispatch(self, request):
        return render(request, 'maps/index.html', {})


def generateMapCoordinates(north, south, east, west):
    return MapCoordinates.objects.filter(
                lat__lte=north
            ).filter(
                lat__gte=south
            ).filter(
                lng__lte=east
            ).filter(
                lng__gte=west
            )


def InitMap(request):
    response = MapsResponse()
    getcontext().prec = 9
    date = float(request.POST['date'][:-3])
    hour = time.strftime("%H%M", time.localtime(date))
    days = [time.strftime("%A", time.localtime(date)),
            time.strftime("%A", time.localtime(date+86400))] #24 hours
    
    north = Decimal(request.POST['north'])
    south = Decimal(request.POST['south'])
    east = Decimal(request.POST['east'])
    west = Decimal(request.POST['west'])

    mapsqueryset = generateMapCoordinates(north, south, east, west)

    signset = mapsqueryset.exclude(sign_id=None)
    signids = [c['sign_id'] for c in signset.values('sign_id').annotate(n=Count("pk"))]
    signs = Sign.objects.filter(id__in=signids)

    for sign in signs:
        if sign.applies(days, hour):
            zc = MapCoordinates.objects.filter(zone_id=sign.zone_id)
            sc = MapCoordinates.objects.filter(sign_id=sign.id)
            response.addBlockToZone(sign.zone, zc)        
            response.addSignToZone(sign, sc)

    print response.as_dict()
    return JsonResponse(response.as_dict())
