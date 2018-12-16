currentStyle = "default"
currentProduct = "health_beauty"

d3.csv("data/ecommerce-productgrowth.csv")
.then(function(data) {
    
    var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S.000");
    data.forEach(function(d) {
        d.dt_month = parseDate(d.dt_month)
        d.dt_priormonth = parseDate(d.dt_priormonth)
    })

    // console.log(data)
    // data = data.filter(d => d.product_category == "auto")

    var parentDiv = document.getElementById("product-growth")
    var outerWidth = parentDiv.clientWidth;
    var outerHeight = 650;

    // 2. Use the margin convention practice 
    var margin = {top: 20, right: 50, bottom: 50, left: 100}
        , width = outerWidth - margin.left - margin.right // Use the window's width 
        , height = outerHeight - margin.top - margin.bottom; // Use the window's height

    // 1. Add the SVG to the page and employ #2
    var svg = d3.select("#product-growth")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // 5. X scale will use the index of our data
    var xScale = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.dt_month));

    // 6. Y scale will use the randomly generate number 
    var yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d.month_order_ct + 200)]) // input 
        .rangeRound([height, 0]); // output 

    var zScale = d3.scaleLinear()
        .domain([0, Math.PI / 2, Math.PI])
        .range(["rgb(46, 204, 113)", "rgb(191, 191, 191)", "rgb(214, 69, 65)"]);

    var xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat("%b %Y"));

    // 3. Call the x axis in a group tag
    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(-45," + (height + 4) + ")")
        .call(xAxis); // Create an axis component with d3.axisBottom

    svg.append("text")             
        .attr("transform",
              "translate(" + (width/2.2) + " ," + 
                             (height + margin.top + 30)+ ")")
        .style("text-anchor", "middle")
        .text("Purchase Order Date");

    // 4. Call the y axis in a group tag
    svg.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - (margin.left/1.5))
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("# of Purchase Orders"); 
    
    segmentedData = data.map(function(d) {
        segment = []

        segment.push({
            alltime_pctchange_rank: d.alltime_pctchange_rank,
            alltime_diff_rank: d.alltime_diff_rank,
            alltime_order_ct_pctchange: d.alltime_order_ct_pctchange,
            alltime_order_ct_diff: d.alltime_order_ct_diff,
            product_category: d.product_category,
            month: d.dt_priormonth,
            order_ct: d.priormonth_order_ct
        });

        segment.push({
            alltime_pctchange_rank: d.alltime_pctchange_rank,
            alltime_diff_rank: d.alltime_diff_rank,
            alltime_order_ct_pctchange: d.alltime_order_ct_pctchange,
            alltime_order_ct_diff: d.alltime_order_ct_diff,
            product_category: d.product_category,
            month: d.dt_month,
            order_ct: d.month_order_ct
        });

        return segment;
    }).filter(function(d) {
        return d[0].month != null
    });

    // console.log(segmentedData)

    // 7. d3's line generator
    var line = d3.line()
        .x(function(d) { return xScale(d.month); }) // set the x values for the line generator
        .y(function(d) { return yScale(d.order_ct); }); // set the y values for the line generator 

    svg.selectAll(".product-line")
        .data(segmentedData)
        .enter()
        .append("path")
        .attr("class", function(d) {
            classString = "product-line " + "product-line-" +  d[0].product_category;

            if (d[0].alltime_diff_rank < 6) {
                classString += " product-line-topnetgrowth"
            }

            classString += " product-line-month-" + d[0].month.getMonth()

            return classString;
        })
        .attr("d", line)
        .on("mouseover", function(d) {
            svg.selectAll('.product-line')
                .style("visibility", "hidden");
            
            svg.selectAll(".product-circle")
                .style("visibility", "hidden");

            svg.selectAll('.product-line-' + d[0].product_category)
                .attr("opacity", 1)
                .style("visibility", "visible")
                .style("stroke", function(d) { return zScale(Math.atan2(1, d[1]["order_ct"] - d[0]["order_ct"])); })
                .style("stroke-width", 8)
                .raise();

            svg.selectAll(".product-circle-" + d[0].product_category)
                .attr("opacity", 1)
                .attr("r", 5)
                .style("visibility", "visible")
                .style("fill", "rgb(52, 73, 94)")
                .raise();

            lineData = data.filter(function(ld) {
                return ld.product_category == d[0].product_category
            });

            if (currentStyle == "season") {
                var nonHolidayMonths = [8, 0, 1, 2, 3, 4, 5, 6, 7]
                var holidayMonths = [9, 10, 11, 12]
                for (month in nonHolidayMonths) {
                    console.log(".product-line-month-" + month)
                    svg.selectAll(".product-line-month-" + month)
                        .style("visibility", "hidden");

                    svg.selectAll(".product-circle-month-" + month)
                        .style("visibility", "hidden");
                }

                lineData = lineData.filter(function(ld) {
                    return holidayMonths.includes(ld.dt_month.getMonth());
                })
            }

            svg.selectAll(".product-circle-text-line1")
                .data(lineData)
                .enter()
                .append("text")
                .attr("class", "product-circle-text product-circle-text-line1")
                .attr("x", function(d) { return xScale(d.dt_month) - 25; })
                .attr("y", function(d) { 
                    yVal = yScale(d.month_order_ct);
                    yVal += (d.priormonth_order_ct_diff < 0) ? 20 : -10;
                    return yVal; 
                })
                .text(function(d) {
                    circleText = d.month_order_ct;
                    if (d.priormonth_order_ct_pctchange != "NULL") {
                        circleText += " ("
                        if (d.priormonth_order_ct_pctchange > 0) {
                            circleText += "+"
                        }
                        circleText += Math.round(d.priormonth_order_ct_pctchange) + "%)"
                    }

                    return circleText;
                })
                .raise()
             
            svg.append("text")
                .datum(lineData)
                .attr("class", "product-infobox-text")
                .attr("x", width - 100)
                .attr("y", 15)
                .attr("text-anchor", "end")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(d => "Product Category: " + d[0].product_category)

            svg.append("text")
                .datum(lineData)
                .attr("class", "product-infobox-text")
                .attr("x", width - 100)
                .attr("y", 37)
                .attr("text-anchor", "end")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(function(d) {
                    textString = "Net Growth in Purchase Orders: "
                    if (d[0].alltime_order_ct_diff > 0) {
                        textString += "+"
                    }
                    textString += d[0].alltime_order_ct_diff + " (";
                    if (d[0].alltime_order_ct_diff > 0) {
                        textString += "+"
                    }
                    textString += Math.round(d[0].alltime_order_ct_pctchange) + "%)"
                    return textString
                });
            
        })
        .on("mouseout", function(d) {
            if (currentStyle == "default") {
                purchaseLineChartSelectionStyle("All Products");
            } else if (currentStyle == "growth") {
                purchaseLineChartSelectionStyle("Top 5 Products");
            } else if (currentStyle == "selection") {
                purchaseLineChartSelectionStyle($("#product-select").val());
            } else if (currentStyle == "season") {
                purchaseLineChartSelectionStyle("Holiday Season");
            }

            svg.selectAll(".product-circle-text")
                .remove()

            svg.selectAll(".product-infobox-text")
                .remove()
        });

    d3.selectAll('.product-line-topnetgrowth')
        .raise();

    svg.selectAll(".product-circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", function(d) {
            classString = "product-circle " + "product-circle-" + d.product_category;

            if (d.alltime_diff_rank < 6) {
                classString += " product-circle-topnetgrowth"
            }

            classString += " product-circle-month-" + d.dt_month.getMonth()

            return classString;
        })
        .attr("cx", function(d, i) { return xScale(d.dt_month); })
        .attr("cy", function(d, i) { return yScale(d.month_order_ct); })
        .attr("r", 1);


    $(document).ready(function() {
        $('#product-select').on("change", function() {
            purchaseLineChartSelectionStyle(this.value);
        })
    });

    $("#product-select").val("health_beauty");
    purchaseLineChartSelectionStyle("health_beauty")
        
    
    // var orders_barchart_init = barChartv2()
    // .width(1000)
    // .x(function(d) {
    //     return d.str_month
    // })
    // .y(function(d) {
    //     return d.orders_ct_month
    // })
    
    // var obar = d3.select("#product-growth")
    // .datum(data_timefiltered)
    // .call(orders_barchart_init)
    
    // obar.select(".x.axis") 
    //     .selectAll(".tick text")
    //     .attr("transform", "translate(-8,-1) rotate(-45)");
});


var purchaseLineChartDefaultStyle = function() {
    currentStyle = "default";

    d3.selectAll('.product-line')
        // .transition()
        .style("visibility", "visible")
        .style("stroke", "rgb(52, 73, 94)")
        .style("stroke-width", 6);

    d3.selectAll('.product-line-topnetgrowth')
        // .transition()
        .style("visibility", "visible")
        .style("stroke", "rgb(52, 73, 94)")
        .style("stroke-width", 6);

    d3.selectAll('.product-circle-topnetgrowth')
        // .transition()
        .attr("r", 3)
        .style("visibility", "visible")
        .style("fill", "rgb(52, 73, 94)");
        
    d3.selectAll('.product-circle')
        // .transition()
        .attr("r", 3)
        .style("visibility", "visible")
        .style("fill", "rgb(52, 73, 94)");
}

var purchaseLineChartGrowthStyle = function() {
    currentStyle = "growth"

    d3.selectAll('.product-line')
        // .transition()
        .style("visibility", "hidden");

    d3.selectAll('.product-line-topnetgrowth')
        // .transition()
        .style("visibility", "visible")
        .style("stroke", "rgb(52, 73, 94)")
        .style("stroke-width", 6);

    d3.selectAll(".product-circle")
        // .transition()
        .style("visibility", "hidden");

    d3.selectAll('.product-circle-topnetgrowth')
        // .transition()
        .attr("r", 3)
        .style("visibility", "visible")
        .style("fill", "rgb(52, 73, 94)");

}

var purchaseLineChartSeasonStyle = function() {
    currentStyle = "season"

    d3.selectAll('.product-line')
        // .transition()
        .style("visibility", "hidden");

    d3.selectAll('.product-line-month-9')
        // .transition()
        .style("visibility", "visible")
        .style("stroke", "rgb(52, 73, 94)")
        .style("stroke-width", 6);

    d3.selectAll('.product-line-month-10')
        // .transition()
        .style("visibility", "visible")
        .style("stroke", "rgb(52, 73, 94)")
        .style("stroke-width", 6);

    d3.selectAll('.product-line-month-11')
        // .transition()
        .style("visibility", "visible")
        .style("stroke", "rgb(52, 73, 94)")
        .style("stroke-width", 6);

    d3.selectAll('.product-line-month-12')
        // .transition()
        .style("visibility", "visible")
        .style("stroke", "rgb(52, 73, 94)")
        .style("stroke-width", 6);

    d3.selectAll(".product-circle")
        // .transition()
        .style("visibility", "hidden");

    d3.selectAll('.product-circle-month-10')
        // .transition()
        .attr("r", 3)
        .style("visibility", "visible")
        .style("fill", "rgb(52, 73, 94)");

    d3.selectAll('.product-circle-month-11')
        // .transition()
        .attr("r", 3)
        .style("visibility", "visible")
        .style("fill", "rgb(52, 73, 94)");

    d3.selectAll('.product-circle-month-12')
        // .transition()
        .attr("r", 3)
        .style("visibility", "visible")
        .style("fill", "rgb(52, 73, 94)");

    d3.selectAll('.product-circle-month-0')
        // .transition()
        .attr("r", 3)
        .style("visibility", "visible")
        .style("fill", "rgb(52, 73, 94)");

}

var purchaseLineChartSelectionStyle = function(selectedProduct) {
    if (selectedProduct == "All Products") {
        purchaseLineChartDefaultStyle();
        return;
    } 
    
    if (selectedProduct == "Top 5 Products") {
        purchaseLineChartGrowthStyle();
        return;
    }

    if (selectedProduct == "Holiday Season") {
        purchaseLineChartSeasonStyle();
        return;
    }

    currentStyle = "selection"
    currentProduct = selectedProduct

    d3.selectAll('.product-line')
        // .transition()
        .style("visibility", "hidden");

    d3.selectAll('.product-line-' + selectedProduct)
        // .transition()
        .attr("opacity", 1)
        .style("visibility", "visible")
        .style("stroke", "rgb(52, 73, 94)")
        .style("stroke-width", 6);

    d3.selectAll(".product-circle")
        // .transition()
        .style("visibility", "hidden");

    d3.selectAll('.product-circle-' + selectedProduct)
        // .transition()
        .attr("opacity", 1)
        .attr("r", 3)
        .style("visibility", "visible")
        .style("fill", "rgb(52, 73, 94)");

}

