class MapPlot {
	constructor(svg_element_id) {
		this.svg = d3.select('#' + svg_element_id);

		this.svg.attr("width", "100%")
		      .attr("height", "100%")
		      .append("g")

		this.map_container = this.svg.append('g');
		this.point_container = this.svg.append('g');

		const svg_viewbox = this.svg.node().viewBox.animVal;
		this.svg_width = svg_viewbox.width;
		this.svg_height = svg_viewbox.height;

		const projection = d3.geoNaturalEarth1()
			.rotate([0, 0])
			.translate([this.svg_width / 2, this.svg_height / 2])
			.precision(.1);

		const path_generator = d3.geoPath()
			.projection(projection);

		this.map_promise = d3.json("data/110m.json").then((topojson_raw) => {
			const paths = topojson.feature(topojson_raw, topojson_raw.objects.countries);
			return paths.features;
		});

		this.promises = [];

		for (let key in data) {
			let point_promise = d3.csv("data/" + key + ".csv").then((data) => {
				let new_data = [];

				for (let idx = 0; idx < data.length; idx++) {
					new_data.push(data[idx]);
				}

				console.log(new_data);
				createHist(new_data);

				return new_data;
			});

			this.promises.push(point_promise);
		}

		Promise.all([this.map_promise]).then((results) => {
				let map_data = results[0];

				this.map_container.selectAll(".country")
					.data(map_data)
					.enter()
					.append("path")
					.classed("country", true)
					.attr("d", path_generator)
					.style("fill", "white");
		});

		let i = 0;
		let selected = 0;
		this.selKey = Object.keys(data)[0];

		for (let key in data) {
			let p = this.promises[i];

			Promise.all([p]).then((elem) => {
				let point_data = elem[0];
				const r = 3;

				this.point_container.selectAll("." + key)
					.data(point_data.filter(function(d) { return d.ActionGeo_Long != 0 || d.ActionGeo_Lat != 0; }))
					.enter()
					.append("circle")
					.classed(key, true)
					.classed("point", true)
					.attr("r", 0)
					.attr("cx", -r)
					.attr("cy", -r)
					.attr("fill", () => "#" + data[key]["color_1"])
					.attr("transform", (d) => "translate(" + projection([d.ActionGeo_Long, d.ActionGeo_Lat]) + ")")
	        .on("mouseover", function(d) {
	        	  d3.select(this)
								.classed("select", true);
	        })
	        .on("mouseout", function(d) {
	        	  d3.select(this)
								.classed("select", false);
	        });
			});

			i++;
		}

		this.render(0);
	}

	render(id) {
		this.selKey = Object.keys(data)[id];
		let i = 0;

		/* Color transition, somehow isn't smooth

		d3.selectAll(".split-h")
			.transition()
			.duration(600)
			.style("background", "#" + data[selKey]["color_2"]);
		*/

		for (let key in data) {
			let p = this.promises[i];

			Promise.all([p]).then((elem) => {
				let point_data = elem[0]

				this.point_container.selectAll("." + key)
					.transition()
					.duration(600)
					.ease(d3.easeQuad)
					.attr("r", (d) => key == this.selKey ? Math.log(d.NumMentions) + 1 : 0);
			});

			i++;
		}
	}
}


function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	}
}

let minYear = 2000;
let maxYear = 2010;

function scopepreserver(a) {
	return function () {
		return a;
	}
}

whenDocumentLoaded(() => {
	// plot object is global, you can inspect it in the dev-console
	const plot_object = new MapPlot('map-plot');

	let i = 0

	for (let key in data) {
		let orgs = document.getElementById("orgs");
		let temp = document.createElement("li");
		temp.setAttribute("id", key);
		temp.setAttribute("var", i);
		temp.onclick = function() { plot_object.render(this.getAttribute('var')); d3.csv("data/" + this.getAttribute('id') + ".csv").then(createHist) };
		let node = document.createTextNode(data[key]["name"]);

		let css = '#' + key + ':hover{ color: #' + data[key]['color_2'] + '; background-color: #' + data[key]['color_1'] + ' }';
		let style = document.createElement('style');
		style.appendChild(document.createTextNode(css));
		temp.appendChild(style);
		temp.appendChild(node);
		orgs.appendChild(temp);

		i++;
	}
});
