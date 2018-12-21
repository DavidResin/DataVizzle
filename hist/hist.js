function convertSqlDateToDate(sqldate) {
  sqldate = String(sqldate);

  // takes SQLDATE string as argument and gives Date object
  let year = sqldate.substring(0, 4);
  let month = sqldate.substring(4, 6) - 1; // months are 0-indexed in js
  let day = sqldate.substring(6, 8);

  return new Date(year, month, day);
}


// load data
d3.csv('data/amnesty.csv').then(createHist);

function createHist(data) {

  const arrayMaxDate = (array) => array.reduce((acc, val) => Math.max(acc, val.SQLDATE), array[0].SQLDATE);
  const arrayMinDate = (array) => array.reduce((acc, val) => Math.min(acc, val.SQLDATE), array[0].SQLDATE);

  const arrayMaxNumMentions = (array) => array.reduce((acc, val) => Math.max(acc, val.value), array[0].value);

  const formatTime = d3.timeFormat("%B %Y"); // Format tooltip date / time

  //  Use the margin convention practice
  let margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
  };
  let clientRect = d3.select("#hist").node().getBoundingClientRect();
  let width = clientRect.width - margin.left - margin.right;
  let height = clientRect.height - margin.top - margin.bottom;

  // The number of data points
  let n = data.length;

  // get min and max SQLDATE and convert
  let maxDate = convertSqlDateToDate(arrayMaxDate(data));
  let minDate = convertSqlDateToDate(arrayMinDate(data));

  // convert SQLDATE to Date objects and store in 'date' column
  data.map(d => {
    d.date = convertSqlDateToDate(d.SQLDATE);
  });

  // group data into two-month bins and add all NumMentions within each.
  let groupedByTwoMonths = d3.nest()
    .key(function(d) {
      return d3.timeMonth.every(2)(d.date);
    })
    .rollup(function(d) {
      return d3.sum(d, function(g) {
        return g.AvgTone >= 0 ? g.NumMentions : 0;
      });
    }).entries(data);

    let groupedByTwoMonthsNeg = d3.nest()
      .key(function(d) {
        return d3.timeMonth.every(2)(d.date);
      })
      .rollup(function(d) {
        return d3.sum(d, function(g) {
          return g.AvgTone < 0 ? g.NumMentions : 0;
        });
      }).entries(data);

  // get max NumMentions out of accumulated groups
  let maxNumMentions = Math.max(arrayMaxNumMentions(groupedByTwoMonths),arrayMaxNumMentions(groupedByTwoMonthsNeg));

  // set start and end date manually for the x scale
  // this improves comparability when switching between different organizations
  const STARTDATE = new Date("2009-01-01");
  const ENDDATE = new Date("2019-01-01")

  // X scale is a time scale
  let xScale = d3.scaleTime()
    .domain([STARTDATE, ENDDATE]) // input
    .range([0, width]); // output

  // Y scale will use the NumMentions
  let yScale = d3.scaleLinear()
    .domain([-maxNumMentions, maxNumMentions]) // input
    .range([height, 0]); // output

  // d3's line generator
  let line = d3.area()
    .x(function(d) {
      return xScale(new Date(d.key));
    }) // set the x values for the line generator
    .y(function(d) {
      return yScale(d.value);
    }) // set the y values for the line generator
    //.curve(d3.curveMonotoneX) // apply smoothing to the line
    .curve(d3.curveCatmullRom);


  // Define the div for the tooltip
  const div = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Add the SVG to the page and employ margin convention
  let svg = d3.select("#hist").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Call the x axis in a group tag
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

  // Call the y axis in a group tag
  svg.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

  // Append the path, bind the data, and call the line generator
  svg.append("path")
    .datum(data) // 10. Binds data to the line
    .attr("class", "line") // Assign a class for styling
    .attr("d", line); // 11. Calls the line generator

  // Appends a circle for each datapoint
  svg.selectAll(".rectPlus")
    .data(groupedByTwoMonths)
    .enter().append("rect") // Uses the enter().append() method
    .filter((d) => STARTDATE < new Date(d.key))
    .attr("class", "rectPlus") // Assign a class for styling
    .attr("x", function(d) {
      return xScale(new Date(d.key))
    })
    .attr("y", function(d) {
      return yScale(d.value)
    })
    .attr("width", 20)
    .attr("height", function(d) {
      return yScale(maxNumMentions - d.value)
    })
    .on("mouseover", function() {
      d3.select(this)
        .attr('class', 'focus');
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr('class', 'rectPlus');
    })
    .on('mouseover', d => {
      div
        .transition()
        .duration(200)
        .style('opacity', 0.9);
      div
        .html(formatTime(new Date(d.key)) + '</a>' +
          '<br/>' + d.value + ' Mentions')
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY - 28 + 'px');
    });

    svg.selectAll(".rectMinus")
      .data(groupedByTwoMonthsNeg)
      .enter().append("rect") // Uses the enter().append() method
      .filter((d) => STARTDATE < new Date(d.key))
      .attr("class", "rectMinus") // Assign a class for styling
      .attr("x", function(d) {
        return xScale(new Date(d.key))
      })
      .attr("y", function(d) {
        return yScale(0)
      })
      .attr("width", 20)
      .attr("height", function(d) {
        return yScale(maxNumMentions - d.value)
      })
      .on("mouseover", function() {
        d3.select(this)
          .attr('class', 'focus');
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr('class', 'rectMinus');
      })
      .on('mouseover', d => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html( formatTime(new Date(d.key)) + '</a>' +
            '<br/>' + d.value + ' Mentions')
          .style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY - 28 + 'px');
      });


    console.log(groupedByTwoMonths);
}
