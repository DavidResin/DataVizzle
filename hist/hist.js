function convertSqlDateToDate(sqldate) {
  sqldate = String(sqldate);

  // takes SQLDATE string as argument and gives Date object
  let year = sqldate.substring(0, 4);
  let month = sqldate.substring(4, 6) - 1; // months are 0-indexed in js
  let day = sqldate.substring(6,8);

  return new Date(year, month, day);
}


// load data
d3.csv('data/amnesty.csv').then(createHist);

function createHist(data) {

  const arrayMaxDate = (array) => array.reduce((acc, val) => Math.max(acc, val.SQLDATE), array[0].SQLDATE);
  const arrayMinDate = (array) => array.reduce((acc, val) => Math.min(acc, val.SQLDATE), array[0].SQLDATE);

  const arrayMaxNumMentions = (array) => array.reduce((acc, val) => Math.max(acc, val.value), array[0].value);

  const formatTime = d3.timeFormat("%e %B");// Format tooltip date / time

 /* // 2. Use the margin convention practice
  let margin = {top: 50, right: 50, bottom: 50, left: 50}
    , width = window.innerWidth - margin.left - margin.right // Use the window's width
    , height = window.innerHeight - margin.top - margin.bottom; // Use the window's height*/

  let margin = {top: 50, right: 50, bottom: 50, left: 50};
  let clientRect = d3.select("#hist").node().getBoundingClientRect();
  let width = clientRect.width - margin.left - margin.right;
  let height = clientRect.height - margin.top - margin.bottom;

  // The number of data points
  let n = data.length;

  // get min and max SQLDATE and convert
  let maxDate = convertSqlDateToDate(arrayMaxDate(data));
  let minDate = convertSqlDateToDate(arrayMinDate(data));

  // convert SQLDATE to Date objects and store in 'date' column
  data.map(d => { d.date = convertSqlDateToDate(d.SQLDATE); });

  let groupedByThreeMonths = d3.nest()
    .key(function(d) { return d3.timeMonth.every(3)(d.date); })
    .rollup(function(d) {
      return d3.sum(d, function(g) { return g.NumMentions });
    }).entries(data);

  // get max NumMentions out of accumulated groups
  let maxNumMentions = arrayMaxNumMentions(groupedByThreeMonths);

  // Determine the first and list dates in the data set
  let monthExtent = d3.extent(groupedByThreeMonths, function(d) { return new Date(d.key); });

  // console.log(monthExtent);

  // // Create one bin per month, use an offset to include the first and last months
  // let monthBins = d3.timeMonths(d3.timeMonth.offset(monthExtent[0],-1),
  //                                d3.timeMonth.offset(monthExtent[1],1));

  // console.log(monthBins);

  // // Use the histogram layout to create a function that will bin the data
  // let binByMonth = d3.histogram()
  //   .domain(monthBins)
  //   .value(function(d) {
  //     return d.date
  //   });

  // console.log(binByMonth(data));

  // // Define 'div' for tooltips
  // let div = d3.select("#hist")
  //   .append("div")  // declare the tooltip div 
  //   .attr("class", "tooltip")              // apply the 'tooltip' class
  //   .style("opacity", 0);                  // set the opacity to nil

  // // some logs for debugging
  // console.log(data);
  // console.log(minDate, maxDate);
  // console.log(maxNumMentions);
  // console.log(minDate.getMonth())

  // console.log(groupedByThreeMonths);

  // 5. X scale is a time scale
  let xScale = d3.scaleTime()
      .domain(monthExtent) // input
      .range([0, width]); // output

  // 6. Y scale will use the NumMentions
  let yScale = d3.scaleLinear()
      .domain([0, maxNumMentions]) // input
      .range([height, 0]); // output

  // 7. d3's line generator
  let line = d3.area()
      .x(function(d) { return xScale(new Date(d.key)); }) // set the x values for the line generator
      .y(function(d) { return yScale(d.value); }) // set the y values for the line generator
      //.curve(d3.curveMonotoneX) // apply smoothing to the line
      .curve(d3.curveCatmullRom);

  // 1. Add the SVG to the page and employ #2
  let svg = d3.select("#hist").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // 3. Call the x axis in a group tag
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

  // 4. Call the y axis in a group tag
  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

  // 9. Append the path, bind the data, and call the line generator
  svg.append("path")
      .datum(data) // 10. Binds data to the line
      .attr("class", "line") // Assign a class for styling
      .attr("d", line);	 // 11. Calls the line generator

  // 12. Appends a circle for each datapoint
  svg.selectAll(".dot")
      .data(groupedByThreeMonths)
      .enter().append("circle") // Uses the enter().append() method
      .attr("class", "dot") // Assign a class for styling
      .attr("cx", function(d) { return xScale(new Date(d.key)) })
      .attr("cy", function(d) { return yScale(d.value) })
      .attr("r", 5)
      .on("mouseover", function() {
      	  d3.select(this)
          	.attr('class', 'focus');
      })
      .on("mouseout", function() { 
      	  d3.select(this)
          	.attr('class', 'dot');
      })
      // .on("click", function(d) {
      //     div.transition()
      //       .duration(500)  
      //       .style("opacity", 0);
      //     div.transition()
      //       .duration(200)  
      //       .style("opacity", .9);  
      //     div.html(
      //       '<a href= "http://google.com">' + // The first <a> tag
      //       formatTime(d.date) +
      //       "</a>" +                          // closing </a> tag
      //       "<br/>"  + d.close)  
      //       .style("left", (d3.event.pageX) + "px")      
      //       .style("top", (d3.event.pageY - 28) + "px");
      //     console.log("TESTTS")
      // });
}
