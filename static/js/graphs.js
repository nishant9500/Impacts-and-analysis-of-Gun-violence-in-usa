
queue()     //asynchronous call back, when all data loaded , continue to call make graphs
    .defer(d3.json, "/first1/projects")
    .defer(d3.json, "/static/geojson/us-states.json")
    .await(makeGraphs);



function makeGraphs(error, projectsJson, statesJson) {    //pass db.proejcts and us-states to function
  var crimeProjects = projectsJson;
  // var dateFormat = d3.time.format("%Y-%m-%d");
  var dateFormat = d3.time.format("%-m/%-d/%Y");
  var selTop = 10;
  crimeProjects.forEach(function(d){
    d["date"] = dateFormat.parse(d["date"]);
    d["date"].setDate(1);
    d["n_killed"]=+d["n_killed"];
    d["n_injured"]=+d["n_injured"];
    d["n_child_victim"]=+d["n_child_victim"];
    d["n_teen_victim"]=+d["n_teen_victim"];
    d["n_adult_victim"]=+d["n_adult_victim"];
	d["n_male"]=+d["n_male"];
	d["n_female"]=+d["n_female"];
	d["suicide"]=+d["suicide"];
	d["n_guns_involved"]=+d["n_guns_involved"];
	d["n_killed_normalized"]=+d["n_killed_normalized"];

  });


  var ndx = crossfilter(crimeProjects);
  //Define Dimensions
  var dateDim = ndx.dimension(function(d) { return d["date"]; });
  var stateDim = ndx.dimension(function(d) { return d["state_ab"]; });
  var city=ndx.dimension(function(d){return d["city_or_county"]})
  var state=ndx.dimension(function(d) { return d["state"]; });
  var zip=ndx.dimension(function(d) { return d["zip_code"] || ''; });

  var n_gun_Dim = ndx.dimension(function(d){return d["n_guns_involved"];});
  var total_killed = ndx.dimension(function(d) { return d["n_killed"]; });
  //var total_norkilled = ndx.dimension(function(d) { return d["n_killed_normalized"]; });
  var total_injured = ndx.dimension(function(d) { return d["n_injured"]; });
  var n_ch_dimension = ndx.dimension(function(d) { return d["n_child_victim"]; });
   var n_m = ndx.dimension(function(d) { return d["n_male"]; });
    var n_fm = ndx.dimension(function(d) { return d["n_female"]; });




  //-------- for victim chart---------
  var n_child_dim = dateDim.group().reduceSum(function (d) { return d["n_child_victim"]; });
  var n_teen_dim = dateDim.group().reduceSum(function (d) { return d["n_teen_victim"]; });
  var n_adult_dim = dateDim.group().reduceSum(function (d)  { return d["n_adult_victim"]; });
   var n_m_dim = dateDim.group().reduceSum(function (d)  { return d["n_male"]; });
    var n_f_dim = dateDim.group().reduceSum(function (d)  { return d["n_female"]; });
	var n_s_dim = dateDim.group().reduceSum(function (d)  { return d["suicide"]; });


  //--------****-----------


  //Calculate metrics
  var numProjectsByDate = dateDim.group();

  var numGun = n_gun_Dim.group();
  var totalnumkilledByState = stateDim.group().reduceSum(function(d) {
		return d["n_killed"];
	});
	//var totalnumnorkilledByState = stateDim.group().reduceSum(function(d) {return d["n_killed_normalized"];});
  var totalnuminjuredByState = stateDim.group().reduceSum(function(d) {
		return d["n_injured"];
	});




  var all = ndx.groupAll();
  var totalkilled = ndx.groupAll().reduceSum(function(d) {return d["n_killed"];});
  var totalinjured = ndx.groupAll().reduceSum(function(d) {return d["n_injured"];});


  var max_killed_state = totalnumkilledByState.top(1)[0].value;
  // var max_injured_state = totalnuminjuredByState.top(1)[0].value;
  var nameofstate = totalnumkilledByState.top(1)[0]
  console.log('WTF!!!!')


  var nz = ndx.dimension(function(d) { return d["n_male"]; });
	var mz = ndx.dimension(function(d) { return d["n_female"]; });
	var fz = ndx.dimension(function(d) { return d["state","n_male","city_or_county","n_killed"]; });


	var nz2 = fz.group().reduceSum(function (d)  { return d["n_male"]; });
	var mz2 = fz.group().reduceSum(function (d)  { return d["n_female"]; });
	var cityz = city.group();
	var statez=state.group();
	//var statez=state.group().reduceSum(function (d)  { return d["n_killed_normalized"];});
	var zipz=zip.group().reduceSum(function (d)  { return d["zip_code"] || null;});

	function display() {
          var totFilteredRecs = ndx.groupAll().value();
          var end = ofs + pag > totFilteredRecs ? totFilteredRecs : ofs + pag;
          d3.select('#begin')
              .text(end === 0? ofs : ofs + 1);
          d3.select('#end')
              .text(end);
          d3.select('#last')
              .attr('disabled', ofs-pag<0 ? 'true' : null);
          d3.select('#next')
              .attr('disabled', ofs+pag>=totFilteredRecs ? 'true' : null);
          d3.select('#size').text(totFilteredRecs);
          if(totFilteredRecs != ndx.size()){
            d3.select('#totalsize').text("(filtered Total: " + ndx.size() + " )");
          }else{
            d3.select('#totalsize').text('');
          }
      }




  console.log('name is',nameofstate)
  //Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["date"];
	var maxDate = dateDim.top(1)[0]["date"];

  //charts
  var timeChart = dc.barChart("#time-chart");
  var usChart = dc.geoChoroplethChart("#us-chart");
  var numberincidentsND = dc.numberDisplay("#number-projects-nd");
	var totalkilledND = dc.numberDisplay("#total-donations-nd");
  var totalinjuredND = dc.numberDisplay("#total-injured-nd");
  var victimND = dc.compositeChart("#victim-chart");
  var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
	var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
	var locationChart = dc.rowChart("#location-row-chart");
	var chart = dc.pieChart("#test");



  victimND
  .width(600)
  .height(300)
  .margins({ top: 10, right: 10, bottom: 20, left: 40 })
  .dimension(dateDim)
  .transitionDuration(100)

  .brushOn(false)
  .valueAccessor(function(d){return d; })
  // .x(d3.scale.linear().domain([0, 10000]))
  .x(d3.time.scale().domain([minDate, maxDate]))
  .elasticY(true)
  .mouseZoomable(true)
  .yAxisLabel("number of victims")
  .legend(dc.legend().y(0).x(60))

  .yAxisPadding("20%")
  .xAxisPadding("5%")


  .compose([
        dc.lineChart(victimND).group(n_child_dim,"child_victim").colors(['#ff0066'])

		,
        dc.lineChart(victimND).group(n_teen_dim,"teen_victim").colors(['#006622'])

		,
        dc.lineChart(victimND).group(n_adult_dim,"adult_victim").colors(['#ffc080'])

		,
		dc.lineChart(victimND).group(n_m_dim,"male victims").colors(['#ff0000'])

		,
		dc.lineChart(victimND).group(n_f_dim,"female victims").colors(['#e600e6'])

		,


    ])
	;



  numberincidentsND
		.formatNumber(d3.format(".3s"))

		.valueAccessor(function(d){return d; })
		.group(all,"test");



  totalkilledND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(totalkilled)
		.formatNumber(d3.format(".3s"));

  totalinjuredND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(totalinjured)
		.formatNumber(d3.format(".3s"));

  timeChart
  .width(1200)
  .height(160)
  .mouseZoomable(false)
  .margins({top: 10, right: 50, bottom: 30, left: 50})
  .dimension(dateDim)
  .group(numProjectsByDate)
  .transitionDuration(500)
  .x(d3.time.scale().domain([minDate, maxDate]))
  .elasticY(false)
  .xAxisLabel("Year")
  .yAxisLabel("number of incidents")
  .yAxis().ticks(4);






	locationChart
        .width(200)
        .height(250)
        .dimension(mz)
        .group(mz2)
		.legend(dc.legend())
		.colors(['#ff4d4d'])
		.ordering(function(d) { return -d.value })
        .xAxis().ticks(4)
		;

	povertyLevelChart
		.width(300)
		.height(310)
		.rowsCap(10)
		.othersGrouper(false)
        .dimension(zip)
		.legend(dc.legend())
        .group(zipz)
        .ordering(function(d) { return -d.value })
        .colors(['#ffff00'])
        .elasticX(true)
        .labelOffsetY(10)

        .xAxis().ticks(4)

		resourceTypeChart
    	.width(300)
		.height(310)

		.rowsCap(7)
		.legend(dc.legend())
		.othersGrouper(false)
        .dimension(city)
        .group(cityz)
        .ordering(function(d) { return -d.value })
        .colors(['#00ff00'])
        .elasticX(true)
        .labelOffsetY(10)
        .xAxis().ticks(4)

		  chart
    .width(500)
    .height(480)
    .slicesCap(7)
	 .renderLabel(true)
	.othersGrouper(false)
	.label(function(d) {return d.data.key + ' ' + Math.round((d.endAngle - d.startAngle) / Math.PI * 50) + '%';})
    .innerRadius(40)
    .dimension(state)
    .group(statez)
    .legend(dc.legend())

    ;




  usChart.width(990)
		.height(400)

		.dimension(stateDim)
		.group(totalnumkilledByState)
		.colors(["#ffcccc", "#ffb3b3", "#ff8080", "#ff4d4d", "#ff3333", "#ff0000", "#e60000", "#cc0000", "#990000","#660000"])
		.colorDomain([0, max_killed_state])
		.overlayGeoJson(statesJson["features"], "state_ab", function (d) {
			return d.properties.name;
		})
		.projection(d3.geo.albersUsa()
    				.scale(700)
    				.translate([280, 150]))
		.title(function (p) {
			return "State: " + p["key"]
					+ "\n"
					+ "Total Num of Killed: " + Math.round(p["value"]);
		})






  dc.renderAll();

  //add label to us-chart
  var labelG = d3.select("#us-chart svg")
    .append("svg:g")
    .attr("id","labelG")
    .attr("class","Title");

  var project = d3.geo.albersUsa().scale(700).translate([280,150]);

  labelG.selectAll("text")
    .data(labels.features)
    .enter().append("svg:text")
    .text(function(d){return d.properties.name;})
    .attr("x",function(d){return project(d.geometry.coordinates)[0];})
    .attr("y",function(d){return project(d.geometry.coordinates)[1];})
    .attr("dx","-1em");
  //
  // console.log('finsied redenering text')
  // console.log(labels.features)
  // var zoom = d3.behavior.zoom()
  //     .translate(projection.translate())
  //     .sclae(projection.scale())
  //     .scaleExtent([height,8*height])
  //     .on("zoom",zoomed);     //bind the necessary event listeners for zooming




};





var labels = {"type":"FeatureCollection","features":[
{"type":"Feature","id":"01","geometry":{"type":"Point","coordinates":[-86.766233,33.001471]},"properties":{"name":"AL","population":4447100}},
{"type":"Feature","id":"02","geometry":{"type":"Point","coordinates":[-148.716968,61.288254]},"properties":{"name":"Alaska","population":626932}},
{"type":"Feature","id":"04","geometry":{"type":"Point","coordinates":[-111.828711,33.373506]},"properties":{"name":"AZ","population":5130632}},
{"type":"Feature","id":"05","geometry":{"type":"Point","coordinates":[-92.576816,35.080251]},"properties":{"name":"AR","population":2673400}},
{"type":"Feature","id":"06","geometry":{"type":"Point","coordinates":[-119.355165,35.458606]},"properties":{"name":"CA","population":33871648}},
{"type":"Feature","id":"08","geometry":{"type":"Point","coordinates":[-105.203628,39.500656]},"properties":{"name":"CO","population":4301261}},
{"type":"Feature","id":"09","geometry":{"type":"Point","coordinates":[-72.874365,41.494852]},"properties":{"name":"CT","population":3405565}},
{"type":"Feature","id":"10","geometry":{"type":"Point","coordinates":[-75.561908,39.397164]},"properties":{"name":"DE","population":783600}},
{"type":"Feature","id":"11","geometry":{"type":"Point","coordinates":[-77.014001,38.910092]},"properties":{"name":"DC","population":572059}},
{"type":"Feature","id":"12","geometry":{"type":"Point","coordinates":[-81.634622,27.795850]},"properties":{"name":"FL","population":15982378}},
{"type":"Feature","id":"13","geometry":{"type":"Point","coordinates":[-83.868887,33.332208]},"properties":{"name":"GA","population":8186453}},
{"type":"Feature","id":"15","geometry":{"type":"Point","coordinates":[-157.524452,21.146768]},"properties":{"name":"HI","population":1211537}},
{"type":"Feature","id":"16","geometry":{"type":"Point","coordinates":[-115.133222,44.242605]},"properties":{"name":"ID","population":1293953}},
{"type":"Feature","id":"17","geometry":{"type":"Point","coordinates":[-88.380238,41.278216]},"properties":{"name":"IL","population":12419293}},
{"type":"Feature","id":"18","geometry":{"type":"Point","coordinates":[-86.261515,40.163935]},"properties":{"name":"IN","population":6080485}},
{"type":"Feature","id":"19","geometry":{"type":"Point","coordinates":[-93.049161,41.960392]},"properties":{"name":"IA","population":2926324}},
{"type":"Feature","id":"20","geometry":{"type":"Point","coordinates":[-96.536052,38.454303]},"properties":{"name":"KS","population":2688418}},
{"type":"Feature","id":"21","geometry":{"type":"Point","coordinates":[-85.241819,37.808159]},"properties":{"name":"KY","population":4041769}},
{"type":"Feature","id":"22","geometry":{"type":"Point","coordinates":[-91.457133,30.699270]},"properties":{"name":"LA","population":4468976}},
{"type":"Feature","id":"23","geometry":{"type":"Point","coordinates":[-69.719931,44.313614]},"properties":{"name":"ME","population":1274923}},
{"type":"Feature","id":"24","geometry":{"type":"Point","coordinates":[-76.797396,39.145653]},"properties":{"name":"MD","population":5296486}},
{"type":"Feature","id":"25","geometry":{"type":"Point","coordinates":[-71.363628,42.271831]},"properties":{"name":"MA","population":6349097}},
{"type":"Feature","id":"26","geometry":{"type":"Point","coordinates":[-84.170753,42.866412]},"properties":{"name":"MI","population":9938444}},
{"type":"Feature","id":"27","geometry":{"type":"Point","coordinates":[-93.583003,45.210782]},"properties":{"name":"MN","population":4919479}},
{"type":"Feature","id":"28","geometry":{"type":"Point","coordinates":[-89.593164,32.566420]},"properties":{"name":"MS","population":2844658}},
{"type":"Feature","id":"29","geometry":{"type":"Point","coordinates":[-92.153770,38.437715]},"properties":{"name":"MO","population":5595211}},
{"type":"Feature","id":"30","geometry":{"type":"Point","coordinates":[-111.209708,46.813302]},"properties":{"name":"MT","population":902195}},
{"type":"Feature","id":"31","geometry":{"type":"Point","coordinates":[-97.403875,41.183753]},"properties":{"name":"NE","population":1711263}},
{"type":"Feature","id":"32","geometry":{"type":"Point","coordinates":[-116.304648,37.165965]},"properties":{"name":"NV","population":1998257}},
{"type":"Feature","id":"33","geometry":{"type":"Point","coordinates":[-71.463342,43.153046]},"properties":{"name":"NH","population":1235786}},
{"type":"Feature","id":"34","geometry":{"type":"Point","coordinates":[-74.428055,40.438458]},"properties":{"name":"NJ","population":8414350}},
{"type":"Feature","id":"35","geometry":{"type":"Point","coordinates":[-106.342108,34.623012]},"properties":{"name":"NM","population":1819046}},
{"type":"Feature","id":"36","geometry":{"type":"Point","coordinates":[-74.645228,41.507548]},"properties":{"name":"NY","population":18976457}},
{"type":"Feature","id":"37","geometry":{"type":"Point","coordinates":[-79.667654,35.553334]},"properties":{"name":"NC","population":8049313}},
{"type":"Feature","id":"38","geometry":{"type":"Point","coordinates":[-99.334736,47.375168]},"properties":{"name":"ND","population":642200}},
{"type":"Feature","id":"39","geometry":{"type":"Point","coordinates":[-82.749366,40.480854]},"properties":{"name":"OH","population":11353140}},
{"type":"Feature","id":"40","geometry":{"type":"Point","coordinates":[-96.834653,35.597940]},"properties":{"name":"OK","population":3450654}},
{"type":"Feature","id":"41","geometry":{"type":"Point","coordinates":[-122.579524,44.732273]},"properties":{"name":"OR","population":3421399}},
{"type":"Feature","id":"42","geometry":{"type":"Point","coordinates":[-77.075925,40.463528]},"properties":{"name":"PA","population":12281054}},
{"type":"Feature","id":"44","geometry":{"type":"Point","coordinates":[-71.448902,41.753318]},"properties":{"name":"RI","population":1048319}},
{"type":"Feature","id":"45","geometry":{"type":"Point","coordinates":[-81.032387,34.034551]},"properties":{"name":"SC","population":4012012}},
{"type":"Feature","id":"46","geometry":{"type":"Point","coordinates":[-99.043799,44.047502]},"properties":{"name":"SD","population":754844}},
{"type":"Feature","id":"47","geometry":{"type":"Point","coordinates":[-86.397772,35.795862]},"properties":{"name":"TN","population":5689283}},
{"type":"Feature","id":"48","geometry":{"type":"Point","coordinates":[-97.388631,30.943149]},"properties":{"name":"TX","population":20851820}},
{"type":"Feature","id":"49","geometry":{"type":"Point","coordinates":[-111.900160,40.438987]},"properties":{"name":"UT","population":2233169}},
{"type":"Feature","id":"50","geometry":{"type":"Point","coordinates":[-72.814309,44.081127]},"properties":{"name":"VT","population":608827}},
{"type":"Feature","id":"51","geometry":{"type":"Point","coordinates":[-77.835857,37.750345]},"properties":{"name":"VI","population":7078515}},
{"type":"Feature","id":"53","geometry":{"type":"Point","coordinates":[-121.624501,47.341728]},"properties":{"name":"WA","population":5894121}},
{"type":"Feature","id":"54","geometry":{"type":"Point","coordinates":[-80.820221,38.767195]},"properties":{"name":"WV","population":1808344}},
{"type":"Feature","id":"55","geometry":{"type":"Point","coordinates":[-89.001006,43.728544]},"properties":{"name":"WI","population":5363675}},
{"type":"Feature","id":"56","geometry":{"type":"Point","coordinates":[-107.008835,42.675762]},"properties":{"name":"WY","population":493782}}
        ]};
