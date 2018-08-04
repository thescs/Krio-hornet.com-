
// Setting variables
// REST
var baseUrl = "https://gethornet.com/api/v3/";

// Other vars...
var logging = true;
// Reserved for lookup_data/all.json
var ldata;
// --- END of variables definiton


// Logic
// 

function saveSettings(){
    
}

function loadSettings(){
    
}
// REST

function rQuery(type, content)
{
    // init vars
    var qtype, qdata, qdatatype, isasync, basicHTTPauth, skipauth;
    
    // selecting type of the query
    switch (type) {
        case "setSession":
                qUrl = baseUrl+"session.json";
                qtype = "POST";
                qdata = {"session[id]": content["id"], "session[secret]": content["secret"], "session[provider]": "Hornet"};
                qdatatype = "json";
                isasync = false;
            break;
        
        case "getNearby":
                qUrl = baseUrl+"members/near.json";
                qtype = "GET";
                qdata = {page: 1, per_page: 50};
                qdatatype = "json";
                isasync = false;
            break;
            
        case "getViewedMe":
                qUrl = baseUrl+"members/viewed_me.json";
                qtype = "GET";
                qdata = {page: 1, per_page: 50};
                qdatatype = "json";
                isasync = false;
            break;
            
        case "getRecent": // New guys
                qUrl = baseUrl+"members/recent.json";
                qtype = "GET";
                qdata = {page: 1, per_page: 50};
                qdatatype = "json";
                isasync = false;
            break;
            
        case "getLookupData":
            // Using a proxy, because Hornet server is not return X-Allow-Origi.. fuck, fuck, fucking CORS!!11
                qUrl = "https://cors-anywhere.herokuapp.com/https://gethornet.com/api/v3/lookup_data/all.json";
                qtype = "GET";
                qdata = null;
                qdatatype = "json";
                isasync = false;
                skipauth = true;
            break;
            
        case "getProfile":
                qUrl = baseUrl+"members/"+content+".json";
                qtype = "GET";
                qdata = null;
                qdatatype = "json";
                isasync = false;
            break;
            
                         // ATTENTION! THIS METHOD IS NOT FOR GLOBAL SEARCHING!!!
        case "search":   // This is an action for hacking to get an a member.id for Viewed Me members
                qUrl = baseUrl+"members/search";
                qtype = "GET";
                qdata = {"username": content};
                qdatatype = "json";
                isasync = false;
            break;
            
        default:
            if(logging === true) console.log("rQuery(): nothing to do! \""+type+"\" type passed.");
            return false;
    }
    
    // authorization
    if (localStorage.getItem("access_token") !== null && skipauth !== true) {
        basicHTTPauth = {"Authorization": "Hornet " + localStorage.getItem("access_token"), "Accept-language": window.navigator.language};
    } else { basicHTTPauth = {"Accept-language": window.navigator.language}; 
    }
    
    // ajax pattern
    $.ajax({
        url: qUrl,
        type: qtype,
        data: qdata,
        dataType: qdatatype,
        headers: basicHTTPauth,
        beforeSend: function() {
            if(logging === true) console.log("Sending query: "+type);
            $("#loader").show();
        },
        complete: function() {
            if(logging === true) console.log("Query completed: "+type);
        },
        async: isasync,
        success: function(json) {
            if(logging === true) console.log("Query success: "+type);
            postloader(json, type);
            $("#loader").hide();
        },
        error: function(xhr, ajaxOptions, thrownError){
            if(logging === true) console.log("Error while proceeding query :"+thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
            errorhnd(type, ajaxOptions, xhr);
            $("#loader").hide();
            return false;
        }
    });
}

// Pages switcher
function displayPage(page){
    $("#navtabs a[href=#"+page+"]").tab("show");
}

// API errors handler
function errorhnd(type, thrownError, xhr){
   
    $("#alerttext").text(thrownError+" "+xhr.status+" "+xhr.responseText);
    $(".alert").show();
    /*switch (type){
        case "setSession": setSession(json); break;
        default: break;
    }*/
}

// Postloader: proceeding success answers from AJAX
function postloader(json, type){
    
    switch (type){
        case "setSession": setSession(json); break;
        case "getNearby": nearbyHnd(json); break;
        case "getViewedMe": viewedMeHnd(json); break;
        case "getRecent": recentHnd(json); break;
        case "getLookupData": ldata = json; break;
        case "getProfile": fillProfile(json); break;
        case "search": searchHnd(json); break;
        default: break;
    }
}

// Operational functions, working with API and JSON

function setSession(json){
    localStorage.setItem("access_token", json.session.access_token);
    
    $("#navbar form").hide();
    $("#diagtab").text(JSON.stringify(json));
    rQuery("getNearby");
    rQuery("getViewedMe");
    rQuery("getRecent");
    rQuery("getLookupData");

}

function generateMembersHtml(json, viewedme){
    var output = "";
    var click;
    if(logging === true && json === null){ console.log("generateMembers(): json input are empty."); return false;}
    
    for(var i = 0; i < $(json.members).length; i++){
        if(viewedme === true){
            click = "rQuery('search','"+json.members[i].member.account.username+"')";
        } else {
            click = "rQuery('getProfile',"+json.members[i].member.id+")";
        }
        output = output + '<div class="member" onclick="'+click+'"><img src="'+json.members[i].member.thumbnail_large_url
+'"></img></div>';
        //$("#"+json.members[i].member.id).click(rQuery("getProfile", json.members[i].member.id));
    }  
    return output;
}

function nearbyHnd(json){
    if(logging === true && json === null){ console.log("nearbyHnd(): json input are empty."); return false;}
    var a = generateMembersHtml(json);
    $("#nearby .members-grid").html(a);
}

function viewedMeHnd(json){
    if(logging === true && json === null){ console.log("viewedMeHnd(): json input are empty."); return false;}
    var a = generateMembersHtml(json, true);
    $("#viewedme .members-grid").html(a);
}
    
function recentHnd(json){
    if(logging === true && json === null){ console.log("recentHnd(): json input are empty."); return false;}
    var a = generateMembersHtml(json);
    $("#newguys .members-grid").html(a);
}

function searchHnd(json){
    rQuery("getProfile", json.members[0].member.id);
}

function fillProfile(json){
    /*$("#profile-tab").html("<i>"+json.member.display_name+"</i> profile");
    $("#avatar2").attr("src", json.member.photos[0].photo.full_url);
    $("#member-info span.middle").text(json.member.display_name);
    $("#profile-info-headline span").text(json.member.headline);
    $("#profile-info-age span").text(json.member.age);*/
    $.get("res/profile.html", function(f){
       var tpl = f;
       tpl = tpl.replace("{avatar_url}", json.member.photos[0].photo.full_url);
       tpl = tpl.replace("{display_name}", json.member.display_name);
       tpl = tpl.replace("{headline}", json.member.headline);
       tpl = tpl.replace("{age}", json.member.age);
        
        
        $("#profile").html(tpl); 
    });
    
    
    displayPage("profile");
}

/* =======================
 * Setting an actions to DOM elements
 */
$("#loginbtn").click(function(){
    rQuery('setSession', {id: $("#loginid").val(), secret: $("#loginsecret").val()});
});

$(".alert").hide();
$(".alert button").click(function(){$(".alert").hide();});
