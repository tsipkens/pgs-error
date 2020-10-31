
var N_shots = 1,
    gam_vec = linspace(0, 8, 21),
    the_vec = [0, 1/100, 1/20, 1/10, 1/7, 1/5, 1/4, 1/3, 1/2.5, 1/2,
      1/1.5, 1/1.2, 1, 1/0.7, 1/0.5, 1/0.4, 1/0.3, 1/0.2, 1/0.1]
    tau_vec = linspace(0, 0.4, 21);

// get parameters
var the = the_vec[document.getElementById('theSlider').value - 1],
    gam = gam_vec[document.getElementById('gamSlider').value - 1],
    tau = tau_vec[document.getElementById('tauSlider').value - 1];

// display current parameters
document.getElementById('theval').value = the;
document.getElementById('gamval').value = gam;
document.getElementById('tauval').value = tau;

// print to console
console.log([tau, gam, the])

var realize_noise = function (s, n) { return add_noise(s, tau, the, gam, N_shots, n) }
var J_peak = function (the) { return Math.round(100 / the * 10) / 10; }
document.getElementById('theval2').value = J_peak(the);

var n1 = -2,
    n2 = 0,
    n3 = 2;


// set the dimensions and margins of the graph
var margin = {
    top: 0,
    right: 50,
    bottom: 50,
    left: 60
  },
  width = 700 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("https://raw.githubusercontent.com/tsipkens/wat-lii-error/master/data_gaus.csv", function(data) {

  // Add X axis
  var x = d3.scaleLinear()
    .domain([0, 2500])
    .range([0, width]);
  var xAxis = svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
  var xAxis2 = svg.append("g")
    .call(d3.axisTop(x));

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([-30, 195])
    .range([height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));
  svg.append("g")
    .attr("transform", "translate(" + width + ",0)")
    .call(d3.axisRight(y))

  //-- Add axis labels --//
  // Add X axis label:
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr('x', width / 2)
    .attr('y', height + 35)
    .text("Time, t");

  // Y axis label:
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr('transform', 'translate(-35,' + height / 2 + ')rotate(-90)')
    .text("Signal, 100 × s / max{s} [counts]")

  // Fill in the main plot ---------------------------------------------------//
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#E40066")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(function(d) {
        return x(d.t)
      })
      .y(function(d) {
        return y(d.J)
      })
    )

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#EAC435")
    .attr("stroke-width", 1.5)
    .attr('stroke-dasharray', "4 3")
    .attr("id",  'l1')
    .attr("d", d3.line()
      .x(function(d) {
        return x(d.t)
      })
      .y(function(d) {
        return y((1 + tau*n1) * d.J)
      })
    )

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#0E1C36")
    .attr("stroke-width", 1.5)
    .attr('stroke-dasharray', "4 3")
    .attr("id",  'l2')
    .attr("d", d3.line()
      .x(function(d) {
        return x(d.t)
      })
      .y(function(d) {
        return y((1 - tau*n1) * d.J)
      })
    )

  svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", function(d) {
      return x(d.t);
    })
    .attr("cy", function(d) {
      return y(realize_noise([d.J], n1));
    })
    .attr("r", 2)
    .attr("stroke", "black")
    .attr("stroke-width", 0)
    .attr("id",  'A')
    .style("fill", '#EAC435')

  svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", function(d) {
      return x(d.t);
    })
    .attr("cy", function(d) {
      return y(realize_noise([d.J], n2));
    })
    .attr("r", 2)
    .attr("stroke", "black")
    .attr("stroke-width", 0)
    .attr("id",  'B')
    .style("fill", '#E40066')

  svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", function(d) {
      return x(d.t);
    })
    .attr("cy", function(d) {
      return y(realize_noise([d.J], n3));
    })
    .attr("r", 2)
    .attr("stroke", "black")
    .attr("stroke-width", 0)
    .attr("id",  'C')
    .style("fill", '#0E1C36')

  // slider controls
  d3.select("#gamSlider").on("change", function() {
    gam = gam_vec[this.value - 1]
    updatePlot()
  })
  d3.select("#theSlider").on("change", function() {
    the = the_vec[this.value - 1]
    updatePlot()
  })
  d3.select("#tauSlider").on("change", function() {
    tau = tau_vec[this.value - 1]
    updatePlot()
  })

  //------------------------------------------------------------------------//
  // a generic plot updater using a given data set
  // e.g., used whenever the slider for da is changed
  function updatePlot() {
    var realize_noise = function (s, n) {
      return add_noise(s, tau, the, gam, N_shots, n)
    }

    // give these new data to update plot
    svg.select("#l1")
      .datum(data)
      .transition()
      .duration(100)
      .attr("d", d3.line()
        .x(function(d) {
          return x(d.t)
        })
        .y(function(d) {
          return y((1 + tau*n1) * d.J)
        })
      );

    svg.select("#l2")
      .datum(data)
      .transition()
      .duration(100)
      .attr("d", d3.line()
        .x(function(d) {
          return x(d.t)
        })
        .y(function(d) {
          return y((1 - tau*n1) * d.J)
        })
      );

    svg.selectAll("#A")
      .data(data)
      .transition()
      .duration(100)
      .attr("cy", function(d) {
        return y(realize_noise([d.J], n1));
      });

    svg.selectAll("#B")
      .data(data)
      .transition()
      .duration(100)
      .attr("cy", function(d) {
        return y(realize_noise([d.J], n2));
      });

    svg.selectAll("#C")
      .data(data)
      .transition()
      .duration(100)
      .attr("cy", function(d) {
        return y(realize_noise([d.J], n3));
      });
  }
  //------------------------------------------------------------------------//
})


function displayval(val, vec, id) {
  document.getElementById(id).value = Math.round(vec[val - 1] * 100) / 100;
  if (id=="theval") {
    document.getElementById("theval2").value = J_peak(vec[val - 1]);
  }
}