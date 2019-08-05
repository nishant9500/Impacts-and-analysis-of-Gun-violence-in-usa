
// queue()     //asynchronous call back, when all data loaded , continue to call make graphs
//     .defer(d3.json, "/static/second/data_new.json")  //main dataset group by zipcode
//     .await(makeGraphs);
//
//
// function makeGraphs(error, projectsJson) {

Promise.all([
  d3.json("/static/second/data_new.json"),
  d3.json("/static/second/aggregat_ecount_foreach_zipcode.json"),
  d3.json("/static/second/zip_loc.json")


]).then(function(experiments){

//test iteratet the csv file
  var incident_arr = []
  var zip_in_arr = []
  incident_arr = experiments[1]
  zip_in_arr = experiments[2]

  for (i = 0; i < incident_arr.length; i++){
    for (j = 0; j < zip_in_arr.length; j++){
      if(incident_arr[i]['_id'] == zip_in_arr[j]['GEOID']){
        // console.log('cur zip is',incident_arr[i])
        zip_in_arr[j]['count_div_total_pop'] = incident_arr[i]['count']/ zip_in_arr[j]['Total Population']
        zip_in_arr[j]['Accident Sum'] = incident_arr[i]['count']
        zip_in_arr[j]['Avg Income'] = parseInt(zip_in_arr[j]['Median Household Income'])
        // console.log('after change cur zip is',zip_in_arr[j])
      }
    }
  }


  // implement crossfilter 4.28

  var detailndx = crossfilter(zip_in_arr)
  var zip_dic = detailndx.dimension(function(d){return d["GEOID"]})

  var totalaccidentdiv_pop = zip_dic.group().reduceSum(function(d){return d["count_div_total_pop"];});

  //chart for every zip income
  var average_house_hold_income = zip_dic.group().reduceSum(function(d){return d["Avg Income"];});


  var median_house_var = zip_dic.group().reduceSum(function(d){return d["Median House Value"];});

  var all = detailndx.groupAll();



 //finsihed implemented
  // console.log('test_if i already in here');
  var crimeProjects = experiments[0];
  // console.log('what!!!',experiments)
  // var dateFormat = d3.time.format("%-m/%-d/%Y");
  var timeParse = d3.timeParse("%-m/%-d/%Y");
  // console.log('what is timeformat>>>??!!!',dateFormat)
  crimeProjects.forEach(function(d){
    // d["date"] = d3.timeParse(d["date"]);

    d["date"] = timeParse(d["date"])
    d3.timeDay(d["date"])





    d["n_killed"]=+d["n_killed"];
    d["n_injured"]=+d["n_injured"];
    d["n_male_victim"]=+d["n_male_victim"];
    d["n_female_victim"]=+d["n_female_victim"];
});

  //Define Dimensions
//   function reduceInitial() {
//     return {
//         zip_code: 90012
//     };
// }
  var ndx = crossfilter(crimeProjects);
  // var ndx_new = ndx.group(function(d){return d["zip_code"]==900})
  var dateDim = ndx.dimension(function(d) { return d["date"]; });
  var total_killed = ndx.dimension(function(d) { return d["n_killed"]; });
  var total_injured = ndx.dimension(function(d) { return d["n_injured"]; });
  var zipcodeDim = ndx.dimension(function(d){return d["zip_code"];});

  //-------- for victim chart---------
  var n_child_dim = dateDim.group().reduceSum(function (d) { return d["n_child_victim"]; });
  var n_teen_dim = dateDim.group().reduceSum(function (d) { return d["n_teen_victim"]; });
  var n_adult_dim = dateDim.group().reduceSum(function (d)  { return d["n_adult_victim"]; });

  //--------****-----------

  //Calculate metrics
  var numProjectsByDate = dateDim.group();
  var totalkilled_male = dateDim.group().reduceSum(function(d) {
		return d["n_male_victim"];
	});

  var totalkilled_female = dateDim.group().reduceSum(function(d) {
    return d["n_male_victim"];
  });

  var totalnumkilledByZip = zipcodeDim.group().reduceSum(function(d){ return d["n_killed"];});

  var totalaccidentbyzip = zipcodeDim.group().reduceCount();

  // console.log('zipcode group is :',totalaccidentbyzip.top(10));

  // new group test
  var all = ndx.groupAll();
  var totalkilled = ndx.groupAll().reduceSum(function(d) {return d["n_killed"];});
  var totalinjured = ndx.groupAll().reduceSum(function(d) {return d["n_injured"];});

  //Define values (to be used in charts)
  var minDate = dateDim.bottom(1)[0]["date"];
  var maxDate = dateDim.top(1)[0]["date"];
  //
  // console.log('what is max data', maxDate)
  // console.log('what is min date',minDate)
  // //find most dangerous states

  var max_killed_zip = totalnumkilledByZip.top(5);
  // var min_killed_state = totalnumkilledByZip.bottom(1)[0];
  // console.log('dangerous is: ', max_killed_zip);
  // console.log('safest is', min_killed_state);

  var test = totalnumkilledByZip;
  //chart
  var numberProjectsND = dc.numberDisplay("#number-projects-nd");
  // var victimND = dc.compositeChart("#victim-chart");
  var timeChart = dc.barChart("#time-chart");
  var totalkilledND = dc.numberDisplay("#total-donations-nd");
  var totalinjuredND = dc.numberDisplay("#total-injured-nd");
  var pie_forallaccident = dc.pieChart("#pie_for_totall_accient_foreach_zipcode")

  var pie_for_income = dc.pieChart("#pie_for_income")
  var pie_for_house_value = dc.pieChart("#pie_for_house_value")


  pie_for_house_value
    .width(460)
    .height(200)
    .slicesCap(6)
    .innerRadius(30)
    .dimension(zipcodeDim)
    .group(median_house_var)
    .label(function(d){return d.value;})
    .renderLabel(true)
    .title(function(d){ return "this is title"; })
    .legend(dc.legend())
    .renderTitle(true)


  pie_for_income
    .width(460)
    .height(200)
    .slicesCap(6)
    .innerRadius(30)
    .dimension(zipcodeDim)
    .group(average_house_hold_income)
    .label(function(d){return d.value;})
    .renderLabel(true)
    .title(function(d){ return "this is title"; })
    .legend(dc.legend())
    .renderTitle(true)



  pie_forallaccident
    .width(460)
    .height(200)
    .slicesCap(6)
    .innerRadius(30)
    .dimension(zipcodeDim)
    .group(totalaccidentbyzip)
    .label(function(d){return d.key +"(" + Math.floor(d.value/all.value()*100) +")";})
    .legend(dc.legend())
    .on('pretransition',function(pie_forallaccident){
      pie_forallaccident.selectAll('pie_for_totall_accient_foreach_zipcode.pie-slice').text(function(d){
        return dc.utils.printSingleValue((d.endAngle - d.startAngle)/(2*Math.PI)*100)+'%';
      })
    });



  var killed_new = dc.dataTable('#pie_for_428_new_pie')
    .dimension(totalaccidentdiv_pop)
    .group(function(d){return 'zip_code|number of accident/num of pop'})
    .columns([function(d){return d.key},function(d){return d.value}])
    .sortBy(function(d){return d.value})
    .order(d3.descending)
    .size(500)


  var killed = dc.dataTable('#killed')
    .dimension(totalaccidentbyzip)
    .group(function(d){return 'zip_code|number of accident'})
    .columns([function(d){return d.key},function(d){return d.value}])
    .sortBy(function(d){return d.value})
    .order(d3.descending)
    .size(500)



  timeChart
  .width(600)
  .height(160)
  .margins({top: 10, right: 50, bottom: 30, left: 50})
  .dimension(dateDim)
  .group(numProjectsByDate)
  .transitionDuration(500)
  .x(d3.scaleTime().domain([minDate, maxDate]))
  .elasticY(true)
  .xAxisLabel("Year")
  .yAxis().ticks(4);

  numberProjectsND
  .formatNumber(d3.format("d"))
  .valueAccessor(function(d){return d; })
  .group(all);

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

  dc.renderAll();



});

// };
