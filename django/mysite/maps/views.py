from django.views import generic, View
from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Count


from .models import MapCoordinates
from .models import StreetBlock
from .models import Zone

from decimal import *

import datetime
import time
import math


getcontext().prec = 6

class MapsResponse:
    def __init__(self):
        self.zones = {} #this is what I ultimately need.

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
        self.zones[zone.id] = {'c':[], 'd':data}

    def calculateNormal(self, c1, c2):
        print c1, c2
        getcontext().prec = 9
        dy = Decimal(c2['lng']) - Decimal(c1['lng'])
        dx = Decimal(c2['lat']) - Decimal(c1['lat'])
        magnitude = math.sqrt((dx*dx) + (dy*dy))
        scalar = Decimal(magnitude / 0.000150)
        return {'lat': c1['lat']-(dy/scalar), 'lng': c1['lng']+(dx/scalar)}

    def as_dict(self):
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

    date = float(request.POST['date'])
    mtime = time.strftime("%H%M", time.localtime(date))
    day = time.strftime("%A", time.localtime(date))

    north = Decimal(request.POST['north'])
    south = Decimal(request.POST['south'])
    east = Decimal(request.POST['east'])
    west = Decimal(request.POST['west'])

    mapsqueryset = generateMapCoordinates(north, south, east, west)

    mapcoords = mapsqueryset.exclude(sb_id=None).values('sb_id').annotate(n=Count("pk"))
    blockids = [c['sb_id'] for c in mapcoords]
    blocks = StreetBlock.objects.filter(id__in=blockids)

    for block in blocks:
        coords = MapCoordinates.objects.filter(sb_id=block.id)
        for zone in block.zones.all():
            response.addBlockToZone(zone, coords)

    # response.addZoneCoordinates(myzone, coords)
    # coords = MapCoordinates.objects.filter(zone_id=zone['zone_id'])

    # for street in streets:
    #     pk = street.sb.pk
    #     signs = street.sb.signs.filter(days__contains=[day.lower()]).filter(
    #                                     timestart__lte=int(mtime)).filter(
    #                                     timeend__gte=int(mtime))
    #     for sign in signs:
    #         if tempid is None or tempid != pk:
    #             tempid = pk
    #             response.addZone(sign.zone, pk) #label
    #     response.addStreet(pk, street)
    print response.as_dict()
    return JsonResponse(response.as_dict())
