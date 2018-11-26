class MapPlot {

	makeColorbar(svg, color_scale, top_left, colorbar_size, scaleClass=d3.scaleLog) {

		const value_to_svg = scaleClass()
			.domain(color_scale.domain())
			.range([colorbar_size[1], 0]);

		const range01_to_color = d3.scaleLinear()
			.domain([0, 1])
			.range(color_scale.range())
			.interpolate(color_scale.interpolate());

		// Axis numbers
		const colorbar_axis = d3.axisLeft(value_to_svg)
			.tickFormat(d3.format(".0f"))

		const colorbar_g = this.svg.append("g")
			.attr("id", "colorbar")
			.attr("transform", "translate(" + top_left[0] + ', ' + top_left[1] + ")")
			.call(colorbar_axis);

		// Create the gradient
		function range01(steps) {
			return Array.from(Array(steps), (elem, index) => index / (steps-1));
		}

		const svg_defs = this.svg.append("defs");

		const gradient = svg_defs.append('linearGradient')
			.attr('id', 'colorbar-gradient')
			.attr('x1', '0%') // bottom
			.attr('y1', '100%')
			.attr('x2', '0%') // to top
			.attr('y2', '0%')
			.attr('spreadMethod', 'pad');

		gradient.selectAll('stop')
			.data(range01(10))
			.enter()
			.append('stop')
				.attr('offset', d => Math.round(100*d) + '%')
				.attr('stop-color', d => range01_to_color(d))
				.attr('stop-opacity', 1);

		// create the colorful rect
		colorbar_g.append('rect')
			.attr('id', 'colorbar-area')
			.attr('width', colorbar_size[0])
			.attr('height', colorbar_size[1])
			.style('fill', 'url(#colorbar-gradient)')
			.style('stroke', 'black')
			.style('stroke-width', '1px')
	}

	

	constructor(svg_element_id) {
		this.svg = d3.select('#' + svg_element_id);
		
		// may be useful for calculating scales
		const svg_viewbox = this.svg.node().viewBox.animVal;
		this.svg_width = svg_viewbox.width;
		this.svg_height = svg_viewbox.height;

		const projection = d3.geoMercator()
			.rotate([0, 0])
			.translate([this.svg_width / 2, this.svg_height / 2])
			.precision(.1);

		const path_generator = d3.geoPath()
			.projection(projection);

		const color_scale = d3.scaleLog()
			.range(["hsl(62,100%,90%)", "hsl(228, 30%, 20%)"])
			.interpolate(d3.interpolateHcl);

		const population_promise = d3.csv("data/cantons-population.csv").then((data) => {
			let cantonId_to_population = {}

			data.forEach((row) => {
				cantonId_to_population[row.code] = parseFloat(row.density);
			});

			return cantonId_to_population;
		});

		const map_promise = d3.json("data/110m.json").then((topojson_raw) => {
			const paths = topojson.feature(topojson_raw, topojson_raw.objects.countries);
			return paths.features;
		});

		const point_promise = d3.csv("data/results-100-plus.csv").then((data) => {
			let new_data = [];

			for (let idx = 0; idx < data.length; idx++) {
				new_data.push(data[idx]);
			}

			return new_data;
		});

		Promise.all([population_promise, map_promise, point_promise]).then((results) => {
			let cantonId_to_population = results[0];
			let map_data = results[1];
			let point_data = results[2];

			map_data.forEach(canton => {
				canton.properties.density = cantonId_to_population[canton.id];
			});

			const densities = Object.values(cantonId_to_population);
			color_scale.domain([d3.min(densities), d3.max(densities)]);

			this.map_container = this.svg.append('g');
			this.point_container = this.svg.append('g');
			this.label_container = this.svg.append('g');

			this.map_container.selectAll(".canton")
				.data(map_data)
				.enter()
				.append("path")
				.classed("canton", true)
				.attr("d", path_generator)
				.style("fill", "white");

			this.label_container.selectAll(".canton_label")
				.data(map_data)
				.enter()
				.append("text")
				.classed("canton-label", true)
				.attr("transform", (d) => "translate(" + path_generator.centroid(d) + ")")
				.attr("dy", ".35em")
				.text((d) => d.properties.name);

			const r = 3;

			this.point_container.selectAll(".point")
				.data(point_data)
				.enter()
				.append("circle")
      			.filter(function(d) { return !(d.ActionGeo_Long == 0 && d.ActionGeo_Lat == 0) })
				.classed("point", true)
				.attr("r", (d) => Math.sqrt(d.NumMentions) / 5)
				.attr("cx", (d) => -Math.sqrt(d.NumMentions) / 10)
				.attr("cy", (d) => -Math.sqrt(d.NumMentions) / 10)
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.attr("transform", (d) => "translate(" + projection([d.ActionGeo_Long, d.ActionGeo_Lat]) + ")")

		});

		/*const g = this.svg
					.attr("width", "100%")
		    		.attr("height", "100%")
		    		.append('g');

		function zoomed() {
      		g
        	.selectAll('path') // To prevent stroke width from scaling
        	.attr('transform', d3.event.transform);
    	}

		const zoom = d3.zoom()
      		.scaleExtent([1, 8])
      		.on('zoom', zoomed);
		//https://bl.ocks.org/vasturiano/f821fc73f08508a3beeb7014b2e4d50f
		this.svg.call(zoom);
*/

		this.initX;
		this.mouseClicked = false;
		this.s = 1;
		this.rotated = 90;
		  
		//need to store this because on zoom end, using mousewheel, mouse position is NAN
		this.mouse;

		let zoomended = () => {
		  if(this.s !== 1) return;
		  //rotated = rotated + ((d3.mouse(this)[0] - initX) * 360 / (s * width));
		  this.rotated = this.rotated + ((this.mouse[0] - this.initX) * 360 / (this.s * this.svg_width));
		  this.mouseClicked = false;
		};  

		let zoomed = () => {
		  var t = [d3.event.transform.x,d3.event.transform.y];
		  this.s = d3.event.transform.k;
		  var h = 0;

		  t[0] = Math.min(
		    (this.svg_width/this.svg_height)  * (this.s - 1), 
		    Math.max( this.svg_width * (1 - this.s), t[0] )
		  );

		  t[1] = Math.min(
		    h * (this.s - 1) + h * this.s, 
		    Math.max(this.svg_height  * (1 - this.s) - h * this.s, t[1])
		  );

		  this.g.attr("transform", "translate(" + t + ")scale(" + s + ")");

		  //adjust the stroke width based on zoom level
		  d3.selectAll(".boundary").style("stroke-width", 1 / s);

		  this.mouse = d3.mouse(this); 
		  
		  if(this.s === 1 && this.mouseClicked) {
		    //rotateMap(d3.mouse(this)[0]);
		    rotateMap(this.mouse[0]);
		    return;
		  }
		};

		let zoom = d3.zoom()
			.scaleExtent([1, 10])
			.on("zoom", this.zoomed)
			.on("end", this.zoomended);


		this.svg
			.append("svg")
			.attr("width", '100%')
			.attr("height", '100%')
			.on("wheel", function() {
			  //zoomend needs mouse coords
			  this.initX = d3.mouse(this)[0];
			})
			.on("mousedown", function() {
			  //only if scale === 1
			  if(this.s !== 1) return;
			  this.initX = d3.mouse(this)[0];
			  this.mouseClicked = true;
			})
			.call(zoom);

		this.g = this.svg.append("g");

		

	}



	

	//=====================begin map zoom test===========================

	

	
	//==========================end map zoom test=====================
}

function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}

whenDocumentLoaded(() => {
	plot_object = new MapPlot('map-plot');
	// plot object is global, you can inspect it in the dev-console
});
