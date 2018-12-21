
/*
var zoom = d3.behavior.zoom()
	.translate([width / 2, height / 2])
	.scale(scale0)
	.scaleExtent([scale0, scale0 * 8])
	.on("zoom", zoomed);

svg.append()
*/

class MapPlot {
	constructor(svg_element_id) {
		this.svg = d3.select('#' + svg_element_id);

		this.svg.attr("width", "100%")
		      .attr("height", "100%")
		      .append("g")

		this.map_container = this.svg.append('g');
		this.point_container = this.svg.append('g');

		// may be useful for calculating scales
		const svg_viewbox = this.svg.node().viewBox.animVal;
		this.svg_width = svg_viewbox.width;
		this.svg_height = svg_viewbox.height;

		const projection = d3.geoNaturalEarth1()
			.rotate([0, 0])
			.translate([this.svg_width / 2, this.svg_height / 2])
			.precision(.1);

		const path_generator = d3.geoPath()
			.projection(projection);

		const map_promise = d3.json("data/110m.json").then((topojson_raw) => {
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

				return new_data;
			});

			this.promises.push(point_promise);
		}

		Promise.all([map_promise]).then((results) => {
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

		for (let key in data) {
			let p = this.promises[i];

			Promise.all([p]).then((elem) => {
				let point_data = elem[0]
				const r = 3;

				this.point_container.selectAll("." + key)
					.data(point_data)
					.enter()
					.append("circle")
					.classed(key, true)
					.classed("point", true)
					.attr("r", 0)
					.attr("cx", -r)
					.attr("cy", -r)
					.attr("fill", "#888888")
					.attr("transform", (d) => "translate(" + projection([d.ActionGeo_Long, d.ActionGeo_Lat]) + ")");

				this.point_container.selectAll("." + key)
					.transition()
					.duration(400)
					.ease(d3.easeQuad)
					.attr("r", r);
			});

			i++;
		}
	}

	render(id) {
		let selKey = Object.keys(data)[id];
		let i = 0;

		for (let key in data) {
			let p = this.promises[i];

			Promise.all([p]).then((elem) => {
				let point_data = elem[0]
				let finish = key == selKey ? 3 : 0;

				this.point_container.selectAll("." + key)
					.transition()
					.duration(400)
					.ease(d3.easeQuad)
					.attr("r", finish);
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
		temp.setAttribute("id", i);
		temp.onclick = function() { plot_object.render(this.getAttribute('id')) };
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
