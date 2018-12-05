/*

lab-4 solution

*/
const histDiv = document.getElementById("hist-container");

const margin = {
    top: 10,
    right: 40,
    bottom: 150,
    left: 60
  },
  width = histDiv.clientWidth * 0.95,
  height = histDiv.clientHeight * 0.5,
  contextHeight = 50;
contextWidth = width;

const svg = d3.select("#hist-container").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", (height + margin.top + margin.bottom));

d3.csv('climate_mean.csv').then(createHist);

function createHist(data) {
  let countries = [];
  let hists = [];
  let maxDataPoint = 0;
  let minDataPoint = 100; // the init value just have to be big enough to be less than the highest temperature

  // Get countries
  for (let prop in data[0]) {
    if (data[0].hasOwnProperty(prop)) {
      if (prop != 'Year') {
        countries.push(prop);
      }
    }
  };

  let countriesCount = countries.length;
  let startYear = data[0].Year;
  let endYear = data[data.length - 1].Year;
  let histHeight = height * (1 / countriesCount);

  // Get max and min temperature bounds for Y-scale.
  data.map(d => {
    for (let prop in d) {
      if (d.hasOwnProperty(prop) && prop != 'Year') {
        d[prop] = parseFloat(d[prop]);

        if (d[prop] > maxDataPoint) {
          maxDataPoint = d[prop];
        }

        if (d[prop] < minDataPoint) {
          minDataPoint = d[prop];
        }
      }
    }

    /* Convert "Year" column to Date format to benefit
    from built-in D3 mechanisms for handling dates. */
    d.Year = new Date(d.Year, 0, 1);
  });

  for (let i = 0; i < countriesCount; i++) {
    hists.push(new Hist({
      data: data.slice(),
      id: i,
      name: countries[i],
      width: width,
      height: height * (1 / countriesCount),
      maxDataPoint: maxDataPoint,
      minDataPoint: minDataPoint,
      svg: svg,
      margin: margin,
      showBottomAxis: (i == countries.length - 1)
    }));

  }

  // Create a context for a brush
  var contextXScale = d3.scaleTime()
    .range([0, contextWidth])
    .domain(hists[0].xScale.domain());

  var contextAxis = d3.axisBottom(contextXScale)
    .tickSize(contextHeight)
    .tickPadding(-10);

  var contextArea = d3.area()
    .x(function(d) {
      return contextXScale(d.date);
    })
    .y0(contextHeight)
    .y1(0)
    .curve(d3.curveLinear);

  var brush = d3.brushX()
    .extent([
      [contextXScale.range()[0], 0],
      [contextXScale.range()[1], contextHeight]
    ])
    .on("brush", onBrush);

  let context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + (margin.left) + "," + (height + margin.top + histHeight - 10) + ")");

  context.append("g")
    .attr("class", "x axis top")
    .attr("transform", "translate(0,0)")
    .call(contextAxis)

  context.append("g")
    .attr("class", "x brush")
    .call(brush)
    .selectAll("rect")
    .attr("y", 0)
    .attr("height", contextHeight);

  context.append("text")
    .attr("class", "instructions")
    .attr("transform", "translate(0," + (contextHeight + 20) + ")")
    .text('Click and drag above to zoom / pan the data');

  // Brush handler. Get time-range from a brush and pass it to the hists.
  function onBrush() {
    var b = d3.event.selection === null ? contextXScale.domain() : d3.event.selection.map(contextXScale.invert);
    for (var i = 0; i < countriesCount; i++) {
      hists[i].showOnly(b);
    }
  }
}

class Hist {
  constructor(options) {
    this.histData = options.data;
    this.width = options.width;
    this.height = options.height;
    this.maxDataPoint = options.maxDataPoint;
    this.minDataPoint = options.minDataPoint;
    this.svg = options.svg;
    this.id = options.id;
    this.name = options.name;
    this.margin = options.margin;
    this.showBottomAxis = options.showBottomAxis;

    let localName = this.name;

    // Associate xScale with time
    this.xScale = d3.scaleTime()
      .range([0, this.width])
      .domain(d3.extent(this.histData.map(function(d) {
        return d.Year;
      })));

    // Bound yScale using minDataPoint and maxDataPoint
    this.yScale = d3.scaleLinear()
      .range([this.height, 0])
      .domain([this.minDataPoint, this.maxDataPoint]);
    let xS = this.xScale;
    let yS = this.yScale;

    /*
        Create the hist.
        Here we use 'curveLinear' interpolation.
        Play with the other ones: 'curveBasis', 'curveCardinal', 'curveStepBefore'.
        */
    this.area = d3.area()
      .x(function(d) {
        return xS(d.Year);
      })
      .y0(this.height)
      .y1(function(d) {
        return yS(d[localName]);
      })
      .curve(d3.curveLinear);

    // Add the Hist to the HTML page
    this.histContainer = svg.append("g")
      .attr('class', this.name.toLowerCase())
      .attr("transform", "translate(" + this.margin.left + "," + (this.margin.top + (this.height * this.id) + (10 * this.id)) + ")");

    this.histContainer.append("path")
      .data([this.histData])
      .attr("class", "hist")
      .attr("clip-path", "url(#clip-" + this.id + ")")
      .attr("d", this.area);

    this.xAxisTop = d3.axisBottom(this.xScale);
    this.xAxisBottom = d3.axisTop(this.xScale);
    // show only the top axis
    if (this.id == 0) {
      this.histContainer.append("g")
        .attr("class", "x axis top")
        .attr("transform", "translate(0,0)")
        .call(this.xAxisTop);
    }

    // show only the bottom axis
    if (this.showBottomAxis) {
      this.histContainer.append("g")
        .attr("class", "x axis bottom")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxisBottom);
    }

    this.yAxis = d3.axisLeft(this.yScale).ticks(5);

    this.histContainer.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(-15,0)")
      .call(this.yAxis);

    this.histContainer.append("text")
      .attr("class", "country-title")
      .attr("transform", "translate(15,40)")
      .text(this.name);

  }
}

hist.prototype.showOnly = function(b) {
  this.xScale.domain(b);
  this.histContainer.select("path").data([this.histData]).attr("d", this.area);
  this.histContainer.select(".x.axis.top").call(this.xAxisTop);
  this.histContainer.select(".x.axis.bottom").call(this.xAxisBottom);
}