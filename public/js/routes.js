/**
 * @author Matthieu Napoli
 * 
 * This file is part of the program "Calculette Carbone Voyage"
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
    "motorbike": "motorbike",
    "plane": "plane",
    "train": "train",
    "coach": "coach",
    "bus": "bus",
    "bike": "bike",
    "walking": "walking"
};
// Emission factors
var enumEmission = {
    "car"      : 255.97,
    "motorbike": 144.69,
    "plane"    : 388.51,
    "train"    : 37.49,
    "coach"    : 1204.13,
    "bus"      : 1279.3,
    "bike"     : 0.,
    "walking"  : 0.
};
// Enable number of passengers
var enumEnableNumberOfPassengers = {
    "car"      : true,
    "motorbike": true,
    "plane"    : false,
    "train"    : false,
    "coach"    : false,
    "bus"      : false,
    "bike"     : false,
    "walking"  : false
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
    var nbPassengers = 1;
    var obj = doAddRoute(start, end, type, nbPassengers);
    indexRoute = obj.indexRoute;
    route = obj.route;
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
 * @param nbPassengers
 * @returns {indexRoute:int index of the route, route: route}
 */
function doAddRoute(start, end, type, nbPassengers)
{
    var arraySize = routes.push({
        "start": start,
        "end": end,
        "distance": 0.,
        "emission": 0.,
        "type": type,
        "startLatLng": null,
        "endLatLng": null,
        "nbPassengers": nbPassengers
    });
    var indexRoute = arraySize - 1;
    var route = routes[indexRoute];
    return {"indexRoute": indexRoute, "route": route};
}

/**
 * Change route callback
 * @param i route index
 * @returns void
 */
function changeRoute(i)
{
    var type = $("#updateTypeRoute"+i).attr("value");
    route = routes[i];
    route.type = type;
    // Reset nb of passengers
    route.nbPassengers = 1;
    // Save
    saveRoutes();
    // Process and display
    processAndDisplay(route, i);
    updateDisplay();
}

/**
 * Change nb passengers callback
 * @param i route index
 * @returns void
 */
function changeNbPassengers(i)
{
    var nbPassengers = $("#updateNbPassengers"+i).attr("value");
    if (nbPassengers <= 0 || nbPassengers > 5) {
        $("#updateNbPassengers"+i).attr("value", 1);
        nbPassengers = 1;
    }
    route = routes[i];
    route.nbPassengers = nbPassengers;
    // Save
    saveRoutes();
    // Process and display
    processAndDisplay(route, i);
    updateDisplay();
}

/**
 * Add passenger callback
 * @param i route index
 * @returns void
 */
function addPassenger(i)
{
    var nbPassengers = parseInt($("#updateNbPassengers"+i).attr("value"));
    if (nbPassengers < 5) {
        $("#updateNbPassengers"+i).attr("value", nbPassengers + 1);
        changeNbPassengers(i);
    }
}

/**
 * Remove passenger callback
 * @param i route index
 * @returns void
 */
function removePassenger(i)
{
    var nbPassengers = parseInt($("#updateNbPassengers"+i).attr("value"));
    if (nbPassengers > 1) {
        $("#updateNbPassengers"+i).attr("value", nbPassengers - 1);
        changeNbPassengers(i);
    }
}

/**
 * Delete all the routes
 * @returns void
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
    // Update map viewport
    updateMapViewport();
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
    // Update map viewport
    updateMapViewport();
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
        for (i in array) {
            r = array[i];
            if (r.n > 0) {
                doAddRoute(r.s, r.e, r.t, r.n);
            } else {
                doAddRoute(r.s, r.e, r.t, 1);
            }
        }
        // Save
        saveRoutes();
    } else {
        // Else load from storage
        routes = $.storage.get('routes');
        // Detect compatibility break
        var compatibilityBreak = false;
        for (i in routes) {
            if (! routes[i].nbPassengers > 0) {
                compatibilityBreak = true;
            }
        }
        if (compatibilityBreak) {
            deleteAllRoutes();
            saveRoutes();
            loadRoutes();
            return;
        }
    }
    if (routes === null) {
        routes = [];
    } else {
        for (i in routes) {
            processAndDisplay(routes[i], i);
        }
    }
    updateDisplay();
    // Update map viewport
    updateMapViewport();
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
            "t": routes[i].type,
            "n": routes[i].nbPassengers
        });
    }
    var routesArg = encodeURIComponent(JSON.stringify(exportArray));
    var url = "http://" + window.location.host + window.location.pathname
        + "?routes=" + routesArg;
    $("input#tripUrl").attr('value', url);
    var facebookUrl = "http://www.facebook.com/share.php?u="+url;
    $("#tripUrlShareFacebook").attr('href', facebookUrl);
    $("#tripUrlDialog").dialog({
        title: "Lien vers votre voyage",
        show: "fade",
        hide: "fade"
    });
    $("input#tripUrl").click(function() {
        $("input#tripUrl").focus();
        $("input#tripUrl").select();
    });
    $("input#tripUrl").focus();
    $("input#tripUrl").select();
    return false;
}
