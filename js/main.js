var w = 500;
var h = 800;
var padding = 60;
var margin = {
  bottom: 80
};

// フラグではない列の数
var not_flag_num;

var dataset;
var keys = [];
var value = [];
var value_cal = [];
var bar_yScale;
var selection_flag = [];

var active_button = "button_0";
// d3.csv("result/kemerer/result.csv", type, function(error, data) {
d3.csv("result/china/result.csv", type, function(error, data) {

  dataset = data;
  keys = d3.map(data[0]).keys();

  value = data.map(function(d) {
    return Math.abs(d.実工数 - d.予測工数);
  });
  // 選択フラグの初期化(全て1)
  for (var i=0; i<data.length; i++) {
    selection_flag[i] = 1;
  }

  let selection_condition = ["全体"];
  keys.forEach(function(val) {
    if (val.match(/予測フラグ/)) {
      let tmp = val.slice(6, -1);
      selection_condition.push(tmp);
    }
  })
  for ( i in selection_condition ) {
    $("#button_field").append("<button type='button' class='btn my-outline-primary'"
      + "id='button_" + i + "'>"
      + selection_condition[i]
      + "</button>");
  }
  $("#button_0").removeClass("my-outline-primary")
                .addClass("my-primary")
  $(".btn").on("click", function() {button_event(this.id)});

  // フラグではない列の数を取得
  not_flag_num = keys.length - selection_condition.length + 1;

  d3_plot();
  d3_bar();
})

var circle_param = [
  // 予測プロジェクト選択状態のステータス
  {
    cx: 80,
    fill: "grey",
    stroke: "grey"
  },
  // 全プロジェクト選択状態のステータス
  {
    cx: 20,
    fill: "red",
    stroke: "red"
  }
];

// プロジェクトの誤差をプロットする領域の生成
var svg_plot = d3.select("#canvas_plot")
.append("svg")
.attr("width", w/2)
.attr("height", h);
// プロジェクトの誤差に関する棒グラフの描画領域の生成
var svg_bar = d3.select("#canvas_bar")
.append("svg")
.attr("width", w)
.attr("height", h);

function d3_plot() {
  // スケール関数の生成
  var yScale = d3.scale.linear()
    .domain([0, d3.max(value, function(d) { return d; })*1.1 ])
    .range([h - padding, padding]);

  // Y 軸の定義
  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(5);

  // 円の生成
  svg_plot.selectAll("circle")
    .data(value)
    .enter()
    .append("circle")
    .attr("transform", "translate(" + (padding+30) + ",0)")
    .attr("cx", circle_param[1].cx)
    .attr("cy", function(d) {
      return yScale(d);
    })
    .attr("r", 10)
    .attr("id", function(d, i) {
      return "circle" + i;
    })
    .attr("fill", circle_param[1].fill)
    .attr("fill-opacity", 0.3)
    .attr("stroke", circle_param[1].stroke)
    .attr("stroke-width", 1)
    .on("mouseover", function(d) {
    })

  // Y 軸の生成
  svg_plot.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis);

  svg_plot.append("text")
    .text("誤差")
    .attr("id", "circle_axis_text")
    .attr("x", padding/2)
    .attr("y", padding/2 + 10)
    .attr("font-size", 15)
}

// 棒グラフの各値の計算
function analysing (target) {
  // 配列 target の平均を計算
  const target_mean = Math.round(d3.mean(target));

  // 配列 target の中央値を計算
  const target_median = Math.round(d3.median(target));

  // 配列 target の分散を計算
  var tmp = 0;
  target.forEach(function(val) {
    tmp = tmp + Math.pow(val - target_mean, 2);
  });
  const target_variance = Math.round(tmp/target.length);

  var result = [
    // {name: "平均", value: target_mean},
    {name: "中央値", value: target_median},
    {name: "分散", value: target_variance}
  ];
  return result;
};

var bar_param = {
  x: 150,
  width: 80,
  label_font_size: 20
}

// 棒グラフの描画
function d3_bar() {
  value_selection = $.grep(value, function(d, i) {
    return (selection_flag[i] == 1);
  });
  value_cal = analysing(value_selection);
  bar_yScale = function (d, i) {
    var s = d3.scale.linear()
      .range([0, h - margin.bottom - padding])
      .domain([0, value_cal[i].value]);
    return s(d);
  };

  var add_to_span = "";
  for ( var i = 0; i < 4; i++) {
    add_to_span = add_to_span + "<span "
                  + "id='tooltip_text" + i + "'>"
                  + "</span><br />";
  };
  add_to_span = add_to_span.slice(0, -6);
  $("#tooltip").append(add_to_span);

  svg_bar.selectAll("rect")
    .data(value_cal)
    .enter()
    .append("rect")
    .attr("x", function(d, i) {
      return i*bar_param.x;
    })
    .attr("y", padding)
    .attr("width", bar_param.width)
    .attr("height", h-padding-margin.bottom)
    .attr("fill", "#fff")

  svg_bar.selectAll(".rect_dec")
    .data(value_cal)
    .enter()
    .append("rect")
    .attr("class", "rect_dec")
    .attr("x", function(d, i) {
      return i*bar_param.x;
    })
    .attr("y", padding)
    .attr("width", bar_param.width)
    .attr("height", function(d, i) {
      return h - bar_yScale(d.value, i) - margin.bottom - padding;
    })
    .attr("fill", "#d3d3d3")
    .attr("fill-opacity", 0.4)
    .attr("stroke", "#a9a9a9")
    .attr("stroke-opacity", 0.7)
    .attr("stroke-width", 2)

  // 予測したプロジェクトに関する棒
  svg_bar.selectAll(".rect_value")
    .data(value_cal)
    .enter()
    .append("rect")
    .attr("class", "rect_value")
    .attr("x", function(d, i) {
      return i*bar_param.x;
    })
    .attr("y", function(d, i) {
      return h - bar_yScale(d.value, i) - margin.bottom;
    })
    .attr("width", bar_param.width)
    .attr("height", function(d, i) {
      return bar_yScale(d.value, i);
    })
    .attr("fill", "#ff4500")
    .attr("fill-opacity", 0.4)
    .attr("stroke", "#ff0000")
    .attr("stroke-opacity", 0.5)
    .attr("stroke-width", 2)
    .on("mouseover", function(d, i) {
      $("#tooltip").css("visibility", "visible");
      $("#tooltip_text0").text(d.name);
      $("#tooltip_text1").text("選択前: " + value_cal[i].value);
      $("#tooltip_text2").text("選択後: " + d.value);
    })
    .on("mousemove", function() {
      const off = {
        top: event.pageY-90,
        left: event.pageX+10
      };
      $("#tooltip").offset(off)
    })
    .on("mouseout", function() {
      $("#tooltip").css("visibility", "hidden")
    })

  // 棒グラフのテキストを追加
  svg_bar.selectAll(".bar_label")
    .data(value_cal)
    .enter()
    .append("text")
    .text( function(d) {
      return d.name;
    })
    .attr("class", "bar_label")
    .attr("x", function(d, i) {
      return i*bar_param.x + bar_param.width/2;
    })
    .attr("y", (h-margin.bottom/2))
    .attr("text-anchor", "middle")
    .attr("font-size", bar_param.label_font_size)
}

// 予測対象プロジェクトであるか否かを判定
function isPredictable (button_id, project_id) {
  if ( (button_id != "button_0") &&
  (selection_flag[project_id] == 0) ) {
    return 0;
  }
  return 1;
}

// ボタンを押した際の処理
function button_event ( button_id ) {
  const flag_id = parseInt(button_id.slice("button_".length));
  const key_id = not_flag_num + flag_id - 1;

  // 選択したボタンの class を変更
  d3.select("#"+active_button)
    .attr("class", "btn my-outline-primary")
  d3.select("#"+button_id)
    .attr("class", "btn my-primary")
  active_button = button_id;

  // 予測フラグを取得
  selection_flag = dataset.map(function(d) {
    if (flag_id == 0) {
      return 1;
    } else {
      return d[keys[key_id]];
    }
  });

  // 予測するかいなかでプロジェクトの描画を変更
  svg_plot.selectAll("circle")
  .transition()
  .duration(1000)
  .ease("elastic")
  .attr("cx", function(d, i) {
    const flag = isPredictable(button_id, i);
    return circle_param[flag].cx;
  })
  .attr("fill", function(d, i) {
    const flag = isPredictable(button_id, i);
    return circle_param[flag].fill;
  })
  .attr("stroke", function(d, i) {
    const flag = isPredictable(button_id, i);
    return circle_param[flag].stroke;
  })

  // 選択プロジェクトにおける値を計算
  value_selection = $.grep(value, function(d, i) {
    return (selection_flag[i] == 1);
  });
  value_selection_set = analysing(value_selection);
  svg_bar.selectAll(".rect_dec")
    .data(value_selection_set)
    .transition()
    .duration(1000)
    .attr("height", function(d, i) {
      return h - bar_yScale(d.value, i) - margin.bottom - padding;
    })
  svg_bar.selectAll(".rect_value")
    .data(value_selection_set)
    .transition()
    .duration(1000)
    .attr("y", function(d, i) {
      return h - bar_yScale(d.value, i) - margin.bottom;
    })
    .attr("height", function(d, i) {
      return bar_yScale(d.value, i);
    })
}

function type(d) {
  var dkeys = d3.map(d).keys();
  dkeys.shift();
  var dlen = dkeys.length;
  for (var i = 0; i < dlen; i++) d[dkeys[i]] = +d[dkeys[i]];
  return d;
}
