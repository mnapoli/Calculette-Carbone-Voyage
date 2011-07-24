/**
 * @author Matthieu Napoli
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the Lesser GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  Lesser GNU General Public License for more details.
 *
 *  You should have received a copy of the Lesser GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// Route type
var enumRouteType = {
        "car": "car",
        "plane": "plane",
        "train": "train",
        "coach": "coach",
        "bus": "bus",
        "bike": "bike",
        "walking": "walking"
};
// Emission factors
var enumEmission = {
        "car": 129.62,
        "plane": 160.,
        "train": 14.62,
        "coach": 30.,
        "bus": 33.4,
        "bike": 0.,
        "walking": 0.
};

/**
 * Routes
 */
var routes = [];
var routesDisplays = [];

/**
 * Add route callback
 * @param event
 * @return void
 */
function addRoute(event)
{
    var start = $("#addStart").attr("value");
    var end = $("#addEnd").attr("value");
    var type = $("#addType").attr("value");
    doAddRoute(start, end, type);
    // Save
    saveRoutes();
    // Process and display
    processAndDisplay(route, indexRoute);
    updateDisplay();
}

/**
 * Add route to the array
 * @param start
 * @param end
 * @param type
 */
function doAddRoute(start, end, type)
{
    var arraySize = routes.push({
        "start": start,
        "end": end,
        "distance": 0.,
        "emission": 0.,
        "type": type,
        "startLatLng": null,
        "endLatLng": null
    });
    var indexRoute = arraySize - 1;
    var route = routes[indexRoute];
}

/**
 * Delete all the routes
 * @return void
 */
function deleteAllRoutes()
{
    for (i in routes) {
        if (routesDisplays[i] != null) {
            routesDisplays[i].setMap(null);
            routesDisplays[i] = null;
        }
    }
    routes = [];
    routesDisplays = [];
    // Save
    saveRoutes();
    // Update
    updateTotal();
    updateDisplay();
    return false;
}

/**
 * Delete the route
 * @param i Route index
 * @return void
 */
function deleteRoute(i)
{
    routes.splice(i, 1);
    if (routesDisplays[i] != null) {
        routesDisplays[i].setMap(null);
        routesDisplays[i] = null;
    }
    routesDisplays.splice(i, 1);
    // Save
    saveRoutes();
    // Update
    updateTotal();
    updateDisplay();
    return false;
}

function saveRoutes()
{
    $.storage.set('routes', routes);
}

function loadRoutes()
{
    var paramValue = getParameterByName("routes");
    // If in url
    if (paramValue != "") {
        routes = [];
        array = eval("(" + paramValue + ")");
        for each(r in array) {
            doAddRoute(r.s, r.e, r.t);
        }
        // Save
        saveRoutes();
    } else {
        // Else load from storage
        routes = $.storage.get('routes');
    }
    if (routes === null) {
        routes = [];
    } else {
        for (i in routes) {
            processAndDisplay(routes[i], i);
        }
        updateDisplay();
    }
}

/**
 * Show a link to the routes
 * @return void
 */
function showLink()
{
    var exportArray = [];
    for (i in routes) {
        exportArray.push({
            "s": routes[i].start,
            "e": routes[i].end,
            "t": routes[i].type
        });
    }
    var routesArg = encodeURIComponent(JSON.stringify(exportArray));
    messageBox("http://" + window.location.host + window.location.pathname
            + "?routes=" + routesArg,
        "Lien vers ce voyage");
    return false;
}

/**
 * Process and display the route
 * @param route
 * @param indexRoute
 * @return void
 */
function processAndDisplay(route, indexRoute)
{
    switch (route.type) {
        case enumRouteType.car:
        case enumRouteType.walking:
        case enumRouteType.bike:
        case enumRouteType.bus:
        case enumRouteType.coach:
            processAndDisplayGMapDirections(route, indexRoute);
            break;
            
        case enumRouteType.plane:
        case enumRouteType.train:
            processAndDisplayAerialDistance(route, indexRoute);
            break;
            
        default:
            console.error("Unknown route type : "+route.type);
            return;
    }
}

/**
 * Process and display the route using GMap Directions
 * @param route
 * @param indexRoute
 * @return void
 */
function processAndDisplayGMapDirections(route, indexRoute)
{
    var travelMode;
    switch (route.type) {
        case enumRouteType.car:
        case enumRouteType.bus:
        case enumRouteType.coach:
            travelMode = google.maps.DirectionsTravelMode.DRIVING;
            break;
        case enumRouteType.walking:
            travelMode = google.maps.DirectionsTravelMode.WALKING;
            break;
        case enumRouteType.bike:
            travelMode = google.maps.DirectionsTravelMode.DRIVING;
            break;
        default:
            console.error("Unknown route type : "+route.type);
            return;
    }
    var request = {
        origin: route.start, 
        destination: route.end,
        travelMode: travelMode
    };
    // Clear old display
    if (routesDisplays[indexRoute] != null) {
        routesDisplays[indexRoute].setMap(null);
        routesDisplays[indexRoute] = null;
    }
    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            routesDisplays[indexRoute] = new google.maps.DirectionsRenderer({
                polylineOptions: {
                    strokeColor: "#3311EE",
                    strokeOpacity: 0.6,
                    strokeWeight: 5
                },
                suppressMarkers: true,
                suppressBicyclingLayer: true
            });
            routesDisplays[indexRoute].setDirections(response);
            routesDisplays[indexRoute].setMap(map);
            // Extract distances and infos
            var distance = response.routes[0].legs[0].distance.value;
            // Distance in km
            route.distance = distance / 1000.;
            // Calculate emissions
            route.emission = route.distance * enumEmission[route.type];
            // Display infos
            $("#distanceRoute"+indexRoute).html(route.distance.toFixed(0));
            $("#emissionRoute"+indexRoute).html((route.emission / 1000.).toFixed(2));
            // Save
            saveRoutes();
            // Update total
            updateTotal();
        } else {
            deleteRoute(indexRoute);
            messageBox("Le trajet demandé ne peut être résolu.", "Erreur", MSGBOX_ERROR);
        }
    });
}

/**
 * Process and display the route using aerial distance
 * @param route
 * @param indexRoute
 * @return void
 */
function processAndDisplayAerialDistance(route, indexRoute)
{
    // Coordinates have been found, update distance and emission and display
    update = function(route, indexRoute) {
        var distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(route.startLatLng.lat, route.startLatLng.lng),
            new google.maps.LatLng(route.endLatLng.lat, route.endLatLng.lng)
        );
        // Distance in km
        route.distance = distance / 1000.;
        // Calculate emissions
        route.emission = route.distance * enumEmission[route.type];
        // Display infos
        $("#distanceRoute"+indexRoute).html(route.distance.toFixed(0));
        $("#emissionRoute"+indexRoute).html((route.emission / 1000.).toFixed(2));
        // Clear old display
        if (routesDisplays[indexRoute] != null) {
            routesDisplays[indexRoute].setMap(null);
            routesDisplays[indexRoute] = null;
        }
        // Display
        var path = [
            new google.maps.LatLng(route.startLatLng.lat, route.startLatLng.lng),
            new google.maps.LatLng(route.endLatLng.lat, route.endLatLng.lng)
        ];
        routesDisplays[indexRoute] = new google.maps.Polyline({
            path: path,
            strokeColor: "#3311EE",
            strokeOpacity: 0.6,
            strokeWeight: 5
        });
        routesDisplays[indexRoute].setMap(map);
        // Save
        saveRoutes();
        // Update total
        updateTotal();
    };
    // Geocoding for start
    geocoder.geocode({
        'address': route.start
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            route.startLatLng = {
                "lat": results[0].geometry.location.lat(),
                "lng": results[0].geometry.location.lng()
            };
            if (route.startLatLng != null && route.endLatLng != null) {
                update(route, indexRoute);
            }
        } else {
            console.error("Geocoding was not successful: " + status);
        }
    });
    // Geocoding for end
    geocoder.geocode({
        'address': route.end
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            route.endLatLng = {
                    "lat": results[0].geometry.location.lat(),
                    "lng": results[0].geometry.location.lng()
            };
            if (route.startLatLng != null && route.endLatLng != null) {
                update(route, indexRoute);
            }
        } else {
            console.error("Geocoding was not successful: " + status);
        }
    });
}

/**
 * Update total emission
 * @return void
 */
function updateTotal()
{
    var totalEmissions = 0.;
    for each(r in routes) {
        totalEmissions += r.emission;
    }
    totalEmissions = totalEmissions / 1000.;
    $("#totalEmission").html(totalEmissions.toFixed(2)+" kg équivalent CO&#8322;");
}

/**
 * Update the list of routes
 * @return void
 */
function updateDisplay() {
    // Route list
    $("#routeList").empty();
    for (i in routes) {
        route = routes[i];
        // Delete link
        var deleteLink = ' (<a href="#" onclick="deleteRoute('+i+')">supprimer</a>)';
        // Distance field
        var distanceField = ' <p class="distance">Distance : <span id="distanceRoute'+i+'">'
            +route.distance.toFixed(0)
            +'</span> km - Émissions : <span id="emissionRoute'+i+'">'
            +(route.emission / 1000.).toFixed(2)
            +'</span> kg eq. CO&#8322;</p>';
        // Route type
        var routeType = ' <select id="addType">'
            +'<option value="car"'+((route.type=='car')?' selected="selected"':'')+'>Voiture</option>'
            +'<option value="plane"'+((route.type=='plane')?' selected="selected"':'')+'>Avion</option>'
            +'<option value="train"'+((route.type=='train')?' selected="selected"':'')+'>Train</option>'
            +'<option value="coach"'+((route.type=='coach')?' selected="selected"':'')+'>Autocar</option>'
            +'<option value="bus"'+((route.type=='bus')?' selected="selected"':'')+'>Bus</option>'
            +'<option value="bike"'+((route.type=='bike')?' selected="selected"':'')+'>Vélo</option>'
            +'<option value="walking"'+((route.type=='walking')?' selected="selected"':'')+'>Marche à pied</option>'
            +'</select> ';
        // Set html
        $("#routeList").append("<li class=\"route\">"+route.start+" - "+route.end
            +routeType+deleteLink+distanceField+"</li>");
    }
}
